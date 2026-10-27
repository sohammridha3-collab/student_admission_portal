const prisma = require('../utils/prisma');
const { logAction, createNotification } = require('../utils/auditLogger');
const crypto = require('crypto');

// Helper to get or create student's application
async function getOrCreateStudentApplication(studentId, studentName) {
  let app = await prisma.application.findFirst({
    where: { student_id: studentId },
    include: {
      documents: true,
      payment: true,
      entrance_test: true
    }
  });

  if (!app) {
    const policy = await prisma.systemPolicy.findFirst();
    const appCount = await prisma.application.count();
    const appNumber = `ADM-2026-${String(appCount + 101).padStart(4, '0')}`;

    app = await prisma.application.create({
      data: {
        application_number: appNumber,
        student_id: studentId,
        course_applied: 'Bachelor of Computer Science',
        academic_year: policy ? policy.academic_year : '2026-2027',
        status: 'DRAFT',
        personal_info: JSON.stringify({
          fullName: studentName,
          dob: '',
          gender: '',
          phone: '',
          address: '',
          guardianName: '',
          guardianPhone: ''
        }),
        academic_info: JSON.stringify({
          highSchool: '',
          board: '',
          graduationYear: '',
          gpaOrPercentage: '',
          majorStream: '',
          achievements: ''
        })
      },
      include: {
        documents: true,
        payment: true,
        entrance_test: true
      }
    });

    await prisma.entranceTest.create({
      data: {
        application_id: app.id,
        test_name: 'Undergraduate Academic Aptitude Test (UAAT)',
        status: 'SCHEDULED',
        max_score: 100,
        passing_score: policy ? policy.passing_score : 60
      }
    });
  }

  return app;
}

// 1. Get Application Details & Current Progress
async function getApplication(req, res) {
  try {
    const app = await getOrCreateStudentApplication(req.user.id, req.user.name);
    const policy = await prisma.systemPolicy.findFirst();

    const requiredDocs = policy ? JSON.parse(policy.required_documents) : [
      'High School Transcript',
      'Government ID',
      'Passport Photo'
    ];

    // Compute completion checklist for strict <<include>> workflow
    const personalInfo = app.personal_info ? JSON.parse(app.personal_info) : {};
    const academicInfo = app.academic_info ? JSON.parse(app.academic_info) : {};

    const isFormFilled = Boolean(
      personalInfo.fullName &&
      personalInfo.phone &&
      personalInfo.dob &&
      academicInfo.highSchool &&
      academicInfo.graduationYear
    );

    const uploadedDocTypes = app.documents.map((d) => d.document_type);
    const hasAllRequiredDocs = requiredDocs.every((reqDoc) => uploadedDocTypes.includes(reqDoc));

    const isFeePaid = Boolean(app.payment && app.payment.status === 'COMPLETED');

    const isReadyToSubmit = isFormFilled && hasAllRequiredDocs && isFeePaid && app.status === 'DRAFT';

    const isDeadlinePassed = policy ? new Date() > new Date(policy.application_deadline) : false;

    return res.json({
      application: app,
      policy: {
        ...policy,
        required_documents: requiredDocs,
        isDeadlinePassed
      },
      checklist: {
        isFormFilled,
        hasAllRequiredDocs,
        isFeePaid,
        isReadyToSubmit,
        missingDocs: requiredDocs.filter((reqDoc) => !uploadedDocTypes.includes(reqDoc))
      }
    });
  } catch (error) {
    console.error('getApplication error:', error);
    return res.status(500).json({ error: 'Failed to retrieve application details.' });
  }
}

// 2. Fill Form (Save Personal & Academic Info)
async function fillForm(req, res) {
  try {
    const app = await getOrCreateStudentApplication(req.user.id, req.user.name);

    if (app.status !== 'DRAFT') {
      return res.status(400).json({
        error: 'Application has already been submitted and cannot be modified.'
      });
    }

    const { courseApplied, personalInfo, academicInfo } = req.body;

    const updatedApp = await prisma.application.update({
      where: { id: app.id },
      data: {
        course_applied: courseApplied || app.course_applied,
        personal_info: typeof personalInfo === 'object' ? JSON.stringify(personalInfo) : personalInfo,
        academic_info: typeof academicInfo === 'object' ? JSON.stringify(academicInfo) : academicInfo
      },
      include: {
        documents: true,
        payment: true,
        entrance_test: true
      }
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'APPLICATION_FORM_SAVED',
      details: `Saved application details for ${updatedApp.application_number}`,
      req
    });

    return res.json({
      message: 'Application form details saved successfully!',
      application: updatedApp
    });
  } catch (error) {
    console.error('fillForm error:', error);
    return res.status(500).json({ error: 'Failed to save form details.' });
  }
}

// 3. Upload Document
async function uploadDocument(req, res) {
  try {
    const app = await getOrCreateStudentApplication(req.user.id, req.user.name);

    if (app.status !== 'DRAFT') {
      return res.status(400).json({
        error: 'Application has already been submitted. Documents cannot be added or replaced.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a valid document.' });
    }

    const { documentType } = req.body;
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required.' });
    }

    // Check if a document of this type already exists, remove or replace it
    const existingDoc = await prisma.document.findFirst({
      where: {
        application_id: app.id,
        document_type: documentType
      }
    });

    if (existingDoc) {
      await prisma.document.delete({
        where: { id: existingDoc.id }
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const newDoc = await prisma.document.create({
      data: {
        application_id: app.id,
        document_type: documentType,
        file_url: fileUrl,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        verification_status: 'PENDING'
      }
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded ${documentType} (${req.file.originalname})`,
      req
    });

    return res.status(201).json({
      message: `${documentType} uploaded successfully!`,
      document: newDoc
    });
  } catch (error) {
    console.error('uploadDocument error:', error);
    return res.status(500).json({ error: 'Failed to upload document.' });
  }
}

// 4. Delete Document
async function deleteDocument(req, res) {
  try {
    const app = await getOrCreateStudentApplication(req.user.id, req.user.name);

    if (app.status !== 'DRAFT') {
      return res.status(400).json({
        error: 'Cannot delete documents after application submission.'
      });
    }

    const docId = parseInt(req.params.id, 10);
    const doc = await prisma.document.findFirst({
      where: { id: docId, application_id: app.id }
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    await prisma.document.delete({ where: { id: docId } });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DOCUMENT_DELETED',
      details: `Deleted ${doc.document_type}`,
      req
    });

    return res.json({ message: 'Document removed successfully.' });
  } catch (error) {
    console.error('deleteDocument error:', error);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
}

// 5. Pay Application Fee
async function payFee(req, res) {
  try {
    const app = await getOrCreateStudentApplication(req.user.id, req.user.name);

    if (app.payment && app.payment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Application fee has already been paid.' });
    }

    const policy = await prisma.systemPolicy.findFirst();
    const feeAmount = policy ? policy.application_fee : 75.0;

    const { paymentMethod = 'CREDIT_CARD', cardholderName } = req.body;

    const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Upsert payment record
    const payment = await prisma.payment.upsert({
      where: { application_id: app.id },
      create: {
        application_id: app.id,
        amount: feeAmount,
        transaction_id: transactionId,
        payment_method: paymentMethod,
        status: 'COMPLETED',
        paid_at: new Date()
      },
      update: {
        amount: feeAmount,
        transaction_id: transactionId,
        payment_method: paymentMethod,
        status: 'COMPLETED',
        paid_at: new Date()
      }
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'PAYMENT_COMPLETED',
      details: `Paid $${feeAmount} via ${paymentMethod} (Txn: ${transactionId})`,
      req
    });

    await createNotification({
      userId: req.user.id,
      title: 'Payment Confirmed',
      message: `Your application fee of $${feeAmount} was successfully processed. Transaction ID: ${transactionId}`,
      type: 'SUCCESS'
    });

    return res.json({
      message: 'Payment processed successfully! Fee requirement fulfilled.',
      payment
    });
  } catch (error) {
    console.error('payFee error:', error);
    return res.status(500).json({ error: 'Payment processing failed. Please try again.' });
  }
}

// 6. Submit Application (Strict <<include>> Workflow Verification)
async function submitApplication(req, res) {
  try {
    const app = await getOrCreateStudentApplication(req.user.id, req.user.name);

    if (app.status !== 'DRAFT') {
      return res.status(400).json({
        error: `Application is already ${app.status} and cannot be submitted again.`
      });
    }

    const policy = await prisma.systemPolicy.findFirst();

    // Policy Rule 1: Portal status
    if (policy && policy.portal_status === 'CLOSED') {
      return res.status(400).json({
        error: 'Admission portal is currently closed by the administrator. Submissions are temporarily paused.'
      });
    }

    // Policy Rule 2: Application deadline
    if (policy && new Date() > new Date(policy.application_deadline)) {
      return res.status(400).json({
        error: `The application deadline (${new Date(policy.application_deadline).toLocaleDateString()}) has passed. Submissions are no longer accepted.`
      });
    }

    // Workflow Rule 1: Form Must Be Filled
    const personal = app.personal_info ? JSON.parse(app.personal_info) : {};
    const academic = app.academic_info ? JSON.parse(app.academic_info) : {};

    if (!personal.fullName || !personal.phone || !academic.highSchool) {
      return res.status(400).json({
        error: 'Incomplete Form: Please complete and save all required personal and academic information before submitting.'
      });
    }

    // Workflow Rule 2: All Required Documents Must Be Uploaded
    const requiredDocs = policy ? JSON.parse(policy.required_documents) : [
      'High School Transcript',
      'Government ID',
      'Passport Photo'
    ];

    const uploadedDocTypes = app.documents.map((d) => d.document_type);
    const missingDocs = requiredDocs.filter((reqDoc) => !uploadedDocTypes.includes(reqDoc));

    if (missingDocs.length > 0) {
      return res.status(400).json({
        error: `Missing Required Documents: Please upload ${missingDocs.join(', ')} before submitting.`
      });
    }

    // Workflow Rule 3: Application Fee Must Be Paid
    if (!app.payment || app.payment.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Unpaid Fee: You must complete the application fee payment before final submission.'
      });
    }

    // All rules passed: change status to SUBMITTED
    const updatedApp = await prisma.application.update({
      where: { id: app.id },
      data: {
        status: 'SUBMITTED',
        submission_date: new Date()
      },
      include: {
        documents: true,
        payment: true,
        entrance_test: true
      }
    });

    await logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'APPLICATION_SUBMITTED',
      details: `Application ${updatedApp.application_number} submitted for admission review.`,
      req
    });

    await createNotification({
      userId: req.user.id,
      title: 'Application Submitted!',
      message: `Your application (${updatedApp.application_number}) has been officially submitted and is now queued for document verification by the Admission Office.`,
      type: 'SUCCESS'
    });

    return res.json({
      message: 'Application successfully submitted! You can now track your review progress.',
      application: updatedApp
    });
  } catch (error) {
    console.error('submitApplication error:', error);
    return res.status(500).json({ error: 'Failed to submit application.' });
  }
}

module.exports = {
  getApplication,
  fillForm,
  uploadDocument,
  deleteDocument,
  payFee,
  submitApplication
};
