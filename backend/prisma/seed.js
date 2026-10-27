const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing records...');
  await prisma.notification.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.entranceTest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.systemPolicy.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding System Policy...');
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 45); // 45 days in future

  await prisma.systemPolicy.create({
    data: {
      application_deadline: deadline,
      application_fee: 75.0,
      academic_year: '2026-2027',
      portal_status: 'OPEN',
      required_documents: JSON.stringify([
        'High School Transcript',
        'Government ID',
        'Passport Photo'
      ]),
      passing_score: 60.0,
      announcement: 'Admissions for Academic Year 2026-2027 are officially open. Submit applications before the deadline.'
    }
  });

  console.log('Seeding Users (1 Admin, 2 Officers, 5 Students)...');
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const officerPassword = await bcrypt.hash('Officer@123', 10);
  const studentPassword = await bcrypt.hash('Student@123', 10);

  // 1. Admin (Eleanor Vance)
  const admin = await prisma.user.create({
    data: {
      name: 'Eleanor Vance (Chief Administrator)',
      email: 'admin@admission.edu',
      password_hash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      permissions: JSON.stringify({
        canManageUsers: true,
        canManageRoles: true,
        canConfigureSettings: true,
        canViewAudit: true,
        canExportReports: true
      })
    }
  });

  // 2. Admission Officers
  // Officer 1: Senior Reviewer (Full Decision Authority)
  const officer1 = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'officer@admission.edu',
      password_hash: officerPassword,
      role: 'OFFICER',
      status: 'ACTIVE',
      permissions: JSON.stringify({
        canVerifyDocs: true,
        canGradeTest: true,
        canMakeDecision: true,
        canExportReports: true
      })
    }
  });

  // Officer 2: Junior Reviewer (No final decision authority, tests RBAC)
  const officer2 = await prisma.user.create({
    data: {
      name: 'James Wilson',
      email: 'officer2@admission.edu',
      password_hash: officerPassword,
      role: 'OFFICER',
      status: 'ACTIVE',
      permissions: JSON.stringify({
        canVerifyDocs: true,
        canGradeTest: true,
        canMakeDecision: false, // Restricted
        canExportReports: true
      })
    }
  });

  // 3. Five Students across all application pipeline stages:

  // Student 1: Alice Morgan (SUBMITTED, docs uploaded, fee paid, pending verification)
  const studentAlice = await prisma.user.create({
    data: {
      name: 'Alice Morgan',
      email: 'alice@student.edu',
      password_hash: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const appAlice = await prisma.application.create({
    data: {
      application_number: 'ADM-2026-001',
      student_id: studentAlice.id,
      course_applied: 'Bachelor of Computer Science',
      academic_year: '2026-2027',
      status: 'SUBMITTED',
      submission_date: new Date(),
      personal_info: JSON.stringify({
        fullName: 'Alice Morgan',
        dob: '2005-04-12',
        gender: 'Female',
        phone: '+1 (555) 234-5678',
        address: '742 Evergreen Terrace, Springfield, OR',
        guardianName: 'Robert Morgan',
        guardianPhone: '+1 (555) 876-5432'
      }),
      academic_info: JSON.stringify({
        highSchool: 'Springfield High Academy',
        board: 'State Central Secondary Board',
        graduationYear: '2024',
        gpaOrPercentage: '3.89 / 4.0 GPA',
        majorStream: 'Science, Mathematics & Computing',
        achievements: 'National Merit Scholar, Robotics Club Captain'
      })
    }
  });

  await prisma.document.createMany({
    data: [
      {
        application_id: appAlice.id,
        document_type: 'High School Transcript',
        file_url: '/uploads/sample_transcript.pdf',
        original_filename: 'Alice_Morgan_Official_Transcript.pdf',
        file_size: 245000,
        mime_type: 'application/pdf',
        verification_status: 'PENDING'
      },
      {
        application_id: appAlice.id,
        document_type: 'Government ID',
        file_url: '/uploads/sample_id.pdf',
        original_filename: 'Alice_Morgan_Passport_Copy.pdf',
        file_size: 182000,
        mime_type: 'application/pdf',
        verification_status: 'PENDING'
      },
      {
        application_id: appAlice.id,
        document_type: 'Passport Photo',
        file_url: '/uploads/sample_photo.jpg',
        original_filename: 'Alice_Headshot.jpg',
        file_size: 95000,
        mime_type: 'image/jpeg',
        verification_status: 'PENDING'
      }
    ]
  });

  await prisma.payment.create({
    data: {
      application_id: appAlice.id,
      amount: 75.0,
      transaction_id: 'TXN-ALICE-98213',
      payment_method: 'CREDIT_CARD',
      status: 'COMPLETED',
      paid_at: new Date()
    }
  });

  await prisma.entranceTest.create({
    data: {
      application_id: appAlice.id,
      test_name: 'Undergraduate Academic Aptitude Test (UAAT)',
      status: 'SCHEDULED',
      max_score: 100,
      passing_score: 60
    }
  });

  // Student 2: Bob Davis (APPROVED, offer letter issued)
  const studentBob = await prisma.user.create({
    data: {
      name: 'Bob Davis',
      email: 'bob@student.edu',
      password_hash: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const appBob = await prisma.application.create({
    data: {
      application_number: 'ADM-2026-002',
      student_id: studentBob.id,
      course_applied: 'Bachelor of Software Engineering',
      academic_year: '2026-2027',
      status: 'APPROVED',
      submission_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      decision_date: new Date(),
      review_notes: 'Outstanding entrance test score and verified honors credentials. Formal admission offer granted.',
      personal_info: JSON.stringify({
        fullName: 'Bob Davis',
        dob: '2005-08-20',
        gender: 'Male',
        phone: '+1 (555) 345-6789',
        address: '123 University Blvd, Boston, MA',
        guardianName: 'Helen Davis',
        guardianPhone: '+1 (555) 987-6543'
      }),
      academic_info: JSON.stringify({
        highSchool: 'Boston Tech Preparatory School',
        board: 'New England STEM Curriculum',
        graduationYear: '2024',
        gpaOrPercentage: '3.95 / 4.0 GPA',
        majorStream: 'Computer Science & Mathematics',
        achievements: 'First Place State Coding Olympiad 2024'
      })
    }
  });

  await prisma.document.createMany({
    data: [
      {
        application_id: appBob.id,
        document_type: 'High School Transcript',
        file_url: '/uploads/sample_transcript.pdf',
        original_filename: 'Bob_Davis_Official_Transcript.pdf',
        file_size: 310000,
        mime_type: 'application/pdf',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      },
      {
        application_id: appBob.id,
        document_type: 'Government ID',
        file_url: '/uploads/sample_id.pdf',
        original_filename: 'Bob_Davis_Drivers_License.pdf',
        file_size: 154000,
        mime_type: 'application/pdf',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      },
      {
        application_id: appBob.id,
        document_type: 'Passport Photo',
        file_url: '/uploads/sample_photo.jpg',
        original_filename: 'Bob_Photo.jpg',
        file_size: 88000,
        mime_type: 'image/jpeg',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      }
    ]
  });

  await prisma.payment.create({
    data: {
      application_id: appBob.id,
      amount: 75.0,
      transaction_id: 'TXN-BOB-77192',
      payment_method: 'CREDIT_CARD',
      status: 'COMPLETED',
      paid_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.entranceTest.create({
    data: {
      application_id: appBob.id,
      test_name: 'Undergraduate Academic Aptitude Test (UAAT)',
      test_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      score: 88.5,
      max_score: 100,
      passing_score: 60,
      status: 'COMPLETED',
      notes: 'Exceptional analytical capability and sound mathematical logic.',
      conducted_by_id: officer1.id
    }
  });

  // Student 3: Charlie Parker (DRAFT, testing submission locks)
  const studentCharlie = await prisma.user.create({
    data: {
      name: 'Charlie Parker',
      email: 'charlie@student.edu',
      password_hash: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const appCharlie = await prisma.application.create({
    data: {
      application_number: 'ADM-2026-003',
      student_id: studentCharlie.id,
      course_applied: 'Bachelor of Data Science & AI',
      academic_year: '2026-2027',
      status: 'DRAFT',
      personal_info: JSON.stringify({
        fullName: 'Charlie Parker',
        dob: '2005-11-05',
        gender: 'Non-binary',
        phone: '+1 (555) 456-7890',
        address: '500 Oak St, Austin, TX',
        guardianName: 'Patricia Parker',
        guardianPhone: '+1 (555) 654-3210'
      }),
      academic_info: JSON.stringify({
        highSchool: 'Austin Central High',
        board: 'Texas State Secondary Board',
        graduationYear: '2024',
        gpaOrPercentage: '3.65 / 4.0 GPA',
        majorStream: 'Mathematics and Statistics',
        achievements: 'Math League Regional Finalist'
      })
    }
  });

  await prisma.document.create({
    data: {
      application_id: appCharlie.id,
      document_type: 'High School Transcript',
      file_url: '/uploads/sample_transcript.pdf',
      original_filename: 'Charlie_Transcript.pdf',
      file_size: 210000,
      mime_type: 'application/pdf',
      verification_status: 'PENDING'
    }
  });

  // Student 4: Diana Prince (UNDER_REVIEW, all docs verified, test scheduled awaiting score)
  const studentDiana = await prisma.user.create({
    data: {
      name: 'Diana Prince',
      email: 'diana@student.edu',
      password_hash: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const appDiana = await prisma.application.create({
    data: {
      application_number: 'ADM-2026-004',
      student_id: studentDiana.id,
      course_applied: 'Bachelor of Electrical Engineering',
      academic_year: '2026-2027',
      status: 'UNDER_REVIEW',
      submission_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      personal_info: JSON.stringify({
        fullName: 'Diana Prince',
        dob: '2005-02-14',
        gender: 'Female',
        phone: '+1 (555) 567-8901',
        address: '88 Gateway Blvd, Seattle, WA',
        guardianName: 'Hippolyta Prince',
        guardianPhone: '+1 (555) 555-1234'
      }),
      academic_info: JSON.stringify({
        highSchool: 'Seattle STEM Institute',
        board: 'Washington Advanced Board',
        graduationYear: '2024',
        gpaOrPercentage: '3.92 / 4.0 GPA',
        majorStream: 'Physics & Electrical Circuits',
        achievements: 'State Science Fair Gold Medalist'
      })
    }
  });

  await prisma.document.createMany({
    data: [
      {
        application_id: appDiana.id,
        document_type: 'High School Transcript',
        file_url: '/uploads/sample_transcript.pdf',
        original_filename: 'Diana_Prince_Transcript.pdf',
        file_size: 290000,
        mime_type: 'application/pdf',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      },
      {
        application_id: appDiana.id,
        document_type: 'Government ID',
        file_url: '/uploads/sample_id.pdf',
        original_filename: 'Diana_Prince_ID.pdf',
        file_size: 160000,
        mime_type: 'application/pdf',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      },
      {
        application_id: appDiana.id,
        document_type: 'Passport Photo',
        file_url: '/uploads/sample_photo.jpg',
        original_filename: 'Diana_Photo.jpg',
        file_size: 92000,
        mime_type: 'image/jpeg',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      }
    ]
  });

  await prisma.payment.create({
    data: {
      application_id: appDiana.id,
      amount: 75.0,
      transaction_id: 'TXN-DIANA-55102',
      payment_method: 'CREDIT_CARD',
      status: 'COMPLETED',
      paid_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.entranceTest.create({
    data: {
      application_id: appDiana.id,
      test_name: 'Undergraduate Academic Aptitude Test (UAAT)',
      status: 'SCHEDULED',
      max_score: 100,
      passing_score: 60
    }
  });

  // Student 5: Evan Wright (REJECTED, test score below cutoff threshold)
  const studentEvan = await prisma.user.create({
    data: {
      name: 'Evan Wright',
      email: 'evan@student.edu',
      password_hash: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const appEvan = await prisma.application.create({
    data: {
      application_number: 'ADM-2026-005',
      student_id: studentEvan.id,
      course_applied: 'Bachelor of Computer Science',
      academic_year: '2026-2027',
      status: 'REJECTED',
      submission_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      decision_date: new Date(),
      review_notes: 'Entrance evaluation score (42/100) below minimum required institutional threshold of 60%.',
      personal_info: JSON.stringify({
        fullName: 'Evan Wright',
        dob: '2005-09-18',
        gender: 'Male',
        phone: '+1 (555) 678-9012',
        address: '320 Elm St, Chicago, IL',
        guardianName: 'Thomas Wright',
        guardianPhone: '+1 (555) 678-0000'
      }),
      academic_info: JSON.stringify({
        highSchool: 'Chicago Lakefront Academy',
        board: 'Midwest Secondary Curriculum',
        graduationYear: '2024',
        gpaOrPercentage: '2.85 / 4.0 GPA',
        majorStream: 'General Studies'
      })
    }
  });

  await prisma.document.createMany({
    data: [
      {
        application_id: appEvan.id,
        document_type: 'High School Transcript',
        file_url: '/uploads/sample_transcript.pdf',
        original_filename: 'Evan_Transcript.pdf',
        file_size: 205000,
        mime_type: 'application/pdf',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      },
      {
        application_id: appEvan.id,
        document_type: 'Government ID',
        file_url: '/uploads/sample_id.pdf',
        original_filename: 'Evan_ID.pdf',
        file_size: 140000,
        mime_type: 'application/pdf',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      },
      {
        application_id: appEvan.id,
        document_type: 'Passport Photo',
        file_url: '/uploads/sample_photo.jpg',
        original_filename: 'Evan_Photo.jpg',
        file_size: 85000,
        mime_type: 'image/jpeg',
        verification_status: 'VERIFIED',
        verified_by_id: officer1.id,
        verified_at: new Date()
      }
    ]
  });

  await prisma.payment.create({
    data: {
      application_id: appEvan.id,
      amount: 75.0,
      transaction_id: 'TXN-EVAN-11893',
      payment_method: 'CREDIT_CARD',
      status: 'COMPLETED',
      paid_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.entranceTest.create({
    data: {
      application_id: appEvan.id,
      test_name: 'Undergraduate Academic Aptitude Test (UAAT)',
      test_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      score: 42.0,
      max_score: 100,
      passing_score: 60,
      status: 'COMPLETED',
      notes: 'Score below passing cutoff criteria.',
      conducted_by_id: officer1.id
    }
  });

  // System Logs
  await prisma.systemLog.createMany({
    data: [
      {
        user_id: admin.id,
        user_name: admin.name,
        user_role: 'ADMIN',
        action: 'POLICY_UPDATE',
        details: 'Configured application cutoff date, fee schedule ($75), and required document policy.',
        ip_address: '127.0.0.1'
      },
      {
        user_id: officer1.id,
        user_name: officer1.name,
        user_role: 'OFFICER',
        action: 'DOC_VERIFICATION',
        details: 'Verified documents for Application ADM-2026-002 (Bob Davis).',
        ip_address: '127.0.0.1'
      },
      {
        user_id: officer1.id,
        user_name: officer1.name,
        user_role: 'OFFICER',
        action: 'APPLICATION_APPROVED',
        details: 'Approved admission offer for Bob Davis (ADM-2026-002).',
        ip_address: '127.0.0.1'
      },
      {
        user_id: officer1.id,
        user_name: officer1.name,
        user_role: 'OFFICER',
        action: 'DOC_VERIFICATION',
        details: 'Verified documents for Application ADM-2026-004 (Diana Prince).',
        ip_address: '127.0.0.1'
      },
      {
        user_id: officer1.id,
        user_name: officer1.name,
        user_role: 'OFFICER',
        action: 'APPLICATION_REJECTED',
        details: 'Issued decline notice for Evan Wright (ADM-2026-005).',
        ip_address: '127.0.0.1'
      }
    ]
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        user_id: studentAlice.id,
        title: 'Application Received',
        message: 'Your application ADM-2026-001 has been submitted and is queued for verification.',
        type: 'SUCCESS'
      },
      {
        user_id: studentBob.id,
        title: '🎉 Admission Offer Granted!',
        message: 'Congratulations! Your application has been approved. Download your formal Admission Offer Letter from your portal.',
        type: 'SUCCESS'
      },
      {
        user_id: studentDiana.id,
        title: 'Documents Verified',
        message: 'All uploaded credentials have been certified authentic by the Admissions Committee.',
        type: 'SUCCESS'
      },
      {
        user_id: studentEvan.id,
        title: 'Application Decision',
        message: 'Your application ADM-2026-005 has been reviewed. Standard entrance criteria was not met for this cycle.',
        type: 'DANGER'
      }
    ]
  });

  console.log('Database successfully seeded with 1 Admin, 2 Officers, and 5 Students!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
