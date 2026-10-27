const prisma = require('../utils/prisma');
const { logAction, createNotification } = require('../utils/auditLogger');

// 1. Get Application Queue with Filtering & Search
async function getApplicationQueue(req, res) {
  try {
    const { status, search, course } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (course && course !== 'ALL') {
      where.course_applied = course;
    }

    if (search) {
      where.OR = [
        { application_number: { contains: search } },
        { student: { name: { contains: search } } },
        { student: { email: { contains: search } } }
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        documents: true,
        payment: true,
        entrance_test: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Counts for dashboard metrics
    const stats = {
      total: await prisma.application.count(),
      submitted: await prisma.application.count({ where: { status: 'SUBMITTED' } }),
      underReview: await prisma.application.count({ where: { status: 'UNDER_REVIEW' } }),
      testScheduled: await prisma.application.count({ where: { status: 'TEST_SCHEDULED' } }),
      approved: await prisma.application.count({ where: { status: 'APPROVED' } }),
      rejected: await prisma.application.count({ where: { status: 'REJECTED' } })
    };

    return res.json({ applications, stats });
  } catch (error) {
    console.error('getApplicationQueue error:', error);
    return res.status(500).json({ error: 'Failed to retrieve application queue.' });
  }
}

// 2. Get Single Application Detail
async function getApplicationDetail(req, res) {
  try {
    const appId = parseInt(req.params.id, 10);

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            created_at: true
          }
        },
        documents: {
          include: {
            verified_by: {
              select: { id: true, name: true }
            }
          }
        },
        payment: true,
        entrance_test: {
          include: {
            conducted_by: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const policy = await prisma.systemPolicy.findFirst();

    // Verify workflow status rules:
    const totalDocs = application.documents.length;
    const verifiedDocs = application.documents.filter((d) => d.verification_status === 'VERIFIED').length;
    const hasRejectedDocs = application.documents.some((d) => d.verification_status === 'REJECTED');
    const allDocsVerified = totalDocs > 0 && verifiedDocs === totalDocs;

    const testCompleted = application.entrance_test &&
      (application.entrance_test.status === 'COMPLETED' || application.entrance_test.status === 'WAIVED');

    return res.json({
      application,
      policy,
      workflowCheck: {
        totalDocs,
        verifiedDocs,
        hasRejectedDocs,
        allDocsVerified,
        testCompleted,
        canMakeDecision: allDocsVerified && testCompleted
      }
    });
  } catch (error) {
    console.error('getApplicationDetail error:', error);
    return res.status(500).json({ error: 'Failed to retrieve application details.' });
  }
}

// 3. Verify or Reject Document (Strict <<include>> rule)
async function verifyDocument(req, res) {
  try {
    const docId = parseInt(req.params.docId, 10);
    const { status, rejectionReason } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "VERIFIED" or "REJECTED".' });
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({ error: 'Please provide a reason for rejecting the document.' });
    }

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: { application: true }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const updatedDoc = await prisma.document.update({
      where: { id: docId },
      data: {
        verification_status: status,
        rejection_reason: status === 'REJECTED' ? rejectionReason : null,
        verified_by_id: req.user.id,
        verified_at: new Date()
      }
    });

    // If application was SUBMITTED, transition to UNDER_REVIEW
    if (document.application.status === 'SUBMITTED') {
      await prisma.application.update({
        where: { id: document.application_id },
        data: { status: 'UNDER_REVIEW' }
      });
    }

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DOCUMENT_VERIFIED',
      details: `${status} document "${document.document_type}" for application #${document.application.application_number}`,
      req
    });

    // Notify student
    await createNotification({
      userId: document.application.student_id,
      title: `Document ${status === 'VERIFIED' ? 'Verified' : 'Rejected'}`,
      message: status === 'VERIFIED'
        ? `Your document "${document.document_type}" has been successfully verified by ${req.user.name}.`
        : `Your document "${document.document_type}" was rejected. Reason: ${rejectionReason}`,
      type: status === 'VERIFIED' ? 'SUCCESS' : 'WARNING'
    });

    return res.json({
      message: `Document status updated to ${status}.`,
      document: updatedDoc
    });
  } catch (error) {
    console.error('verifyDocument error:', error);
    return res.status(500).json({ error: 'Failed to verify document.' });
  }
}

// 4. Conduct / Record Entrance Test Results
async function recordEntranceTest(req, res) {
  try {
    const appId = parseInt(req.params.id, 10);
    const { score, maxScore = 100, passingScore = 60, status = 'COMPLETED', testDate, notes } = req.body;

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: { documents: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Rule: Must have documents verified or under review
    const allDocsVerified = application.documents.length > 0 &&
      application.documents.every((d) => d.verification_status === 'VERIFIED');

    if (!allDocsVerified) {
      return res.status(400).json({
        error: 'Prerequisite not met: You must verify all applicant documents before recording test scores (<<include>> workflow).'
      });
    }

    const test = await prisma.entranceTest.upsert({
      where: { application_id: appId },
      create: {
        application_id: appId,
        test_name: 'Undergraduate Academic Aptitude Test (UAAT)',
        score: score !== undefined ? parseFloat(score) : null,
        max_score: parseFloat(maxScore),
        passing_score: parseFloat(passingScore),
        status: status, // 'COMPLETED', 'WAIVED', 'SCHEDULED'
        test_date: testDate ? new Date(testDate) : new Date(),
        notes: notes || '',
        conducted_by_id: req.user.id
      },
      update: {
        score: score !== undefined ? parseFloat(score) : null,
        max_score: parseFloat(maxScore),
        passing_score: parseFloat(passingScore),
        status: status,
        test_date: testDate ? new Date(testDate) : new Date(),
        notes: notes || '',
        conducted_by_id: req.user.id
      }
    });

    // Update application status to TEST_SCHEDULED if not already approved/rejected
    if (['SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      await prisma.application.update({
        where: { id: appId },
        data: { status: 'TEST_SCHEDULED' }
      });
    }

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ENTRANCE_TEST_RECORDED',
      details: `Recorded entrance test for ${application.application_number}. Status: ${status}, Score: ${score}/${maxScore}`,
      req
    });

    await createNotification({
      userId: application.student_id,
      title: 'Entrance Test Update',
      message: status === 'COMPLETED'
        ? `Your entrance test score has been recorded: ${score}/${maxScore}. Your application is proceeding to final evaluation.`
        : `Your entrance test requirement was marked as ${status}.`,
      type: 'INFO'
    });

    return res.json({
      message: 'Entrance test evaluation saved successfully!',
      test
    });
  } catch (error) {
    console.error('recordEntranceTest error:', error);
    return res.status(500).json({ error: 'Failed to record entrance test.' });
  }
}

// 5. Decision Engine: Approve or Reject Application
async function makeApplicationDecision(req, res) {
  try {
    const appId = parseInt(req.params.id, 10);
    const { decision, notes } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be either "APPROVED" or "REJECTED".' });
    }

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        student: true,
        documents: true,
        entrance_test: true
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // STRICT WORKFLOW RULE 1: All documents MUST be verified
    const allDocsVerified = application.documents.length > 0 &&
      application.documents.every((d) => d.verification_status === 'VERIFIED');

    if (!allDocsVerified) {
      return res.status(400).json({
        error: 'Prerequisite Violated: You cannot make a final decision until all uploaded documents are marked as VERIFIED.'
      });
    }

    // STRICT WORKFLOW RULE 2: Entrance test MUST be conducted or marked waived
    const testCompleted = application.entrance_test &&
      (application.entrance_test.status === 'COMPLETED' || application.entrance_test.status === 'WAIVED');

    if (!testCompleted) {
      return res.status(400).json({
        error: 'Prerequisite Violated: You must conduct/record the entrance test (or mark it waived) before issuing an approval or rejection.'
      });
    }

    const updatedApp = await prisma.application.update({
      where: { id: appId },
      data: {
        status: decision,
        review_notes: notes || (decision === 'APPROVED' ? 'Admission approved by review committee.' : 'Application rejected.'),
        decision_date: new Date()
      },
      include: {
        student: true,
        documents: true,
        entrance_test: true,
        payment: true
      }
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: decision === 'APPROVED' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
      details: `${decision} application #${application.application_number} (${application.student.name}). Notes: ${notes || 'None'}`,
      req
    });

    await createNotification({
      userId: application.student_id,
      title: decision === 'APPROVED' ? '🎉 Congratulations! Admission Offer Issued' : 'Application Decision Update',
      message: decision === 'APPROVED'
        ? `We are delighted to inform you that your application #${application.application_number} has been officially APPROVED! Download your formal admission letter from your portal.`
        : `Your application #${application.application_number} has been reviewed and was not accepted at this time. Notes: ${notes || 'Standard admission criteria not met.'}`,
      type: decision === 'APPROVED' ? 'SUCCESS' : 'DANGER'
    });

    return res.json({
      message: `Application successfully marked as ${decision}.`,
      application: updatedApp
    });
  } catch (error) {
    console.error('makeApplicationDecision error:', error);
    return res.status(500).json({ error: 'Failed to record application decision.' });
  }
}

// 6. Generate Admission Reports (CSV / JSON format)
async function getOfficerReports(req, res) {
  try {
    const { format = 'json', status } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: { select: { name: true, email: true } },
        entrance_test: { select: { score: true, status: true } },
        payment: { select: { amount: true, transaction_id: true, status: true } },
        documents: { select: { verification_status: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const reportRows = applications.map((app) => ({
      applicationNumber: app.application_number,
      studentName: app.student.name,
      studentEmail: app.student.email,
      courseApplied: app.course_applied,
      academicYear: app.academic_year,
      status: app.status,
      entranceScore: app.entrance_test ? (app.entrance_test.score ?? 'N/A') : 'N/A',
      feePaid: app.payment && app.payment.status === 'COMPLETED' ? `$${app.payment.amount}` : 'Unpaid',
      submissionDate: app.submission_date ? app.submission_date.toISOString().split('T')[0] : 'Draft',
      decisionDate: app.decision_date ? app.decision_date.toISOString().split('T')[0] : 'Pending'
    }));

    if (format === 'csv') {
      const headers = ['Application Number,Student Name,Email,Course,Year,Status,Entrance Score,Fee Status,Submission Date,Decision Date'];
      const csvLines = reportRows.map((r) =>
        `"${r.applicationNumber}","${r.studentName}","${r.studentEmail}","${r.courseApplied}","${r.academicYear}","${r.status}","${r.entranceScore}","${r.feePaid}","${r.submissionDate}","${r.decisionDate}"`
      );
      const csvData = [headers, ...csvLines].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="admission_officer_report.csv"');
      return res.send(csvData);
    }

    return res.json({ report: reportRows });
  } catch (error) {
    console.error('getOfficerReports error:', error);
    return res.status(500).json({ error: 'Failed to generate officer admission report.' });
  }
}

module.exports = {
  getApplicationQueue,
  getApplicationDetail,
  verifyDocument,
  recordEntranceTest,
  makeApplicationDecision,
  getOfficerReports
};
