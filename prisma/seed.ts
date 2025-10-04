import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create permissions
  const permissions = [
    // Communication module
    { code: 'COMMUNICATION_VIEW', description: 'View communication module' },
    { code: 'COMMUNICATION_EDIT', description: 'Edit communication data' },
    
    // Reports
    { code: 'REPORTS_VIEW', description: 'View reports' },
    { code: 'REPORTS_CREATE', description: 'Create reports' },
    { code: 'REPORTS_EDIT', description: 'Edit reports' },
    { code: 'REPORTS_DELETE', description: 'Delete reports' },
    { code: 'REPORTS_VALIDATE', description: 'Validate reports' },
    { code: 'REPORTS_DISPUTE', description: 'Dispute reports' },
    
    // Messages
    { code: 'MESSAGES_VIEW', description: 'View messages' },
    { code: 'MESSAGES_CREATE', description: 'Create messages' },
    { code: 'MESSAGES_EDIT', description: 'Edit messages' },
    { code: 'MESSAGES_DELETE', description: 'Delete messages' },
    { code: 'MESSAGES_BULK', description: 'Send bulk messages' },
    
    // Cases
    { code: 'CASES_VIEW', description: 'View cases' },
    { code: 'CASES_CREATE', description: 'Create cases' },
    { code: 'CASES_EDIT', description: 'Edit cases' },
    { code: 'CASES_DELETE', description: 'Delete cases' },
    { code: 'CASES_CANCEL', description: 'Cancel cases' },
    
    // Announcements
    { code: 'ANNOUNCEMENTS_VIEW', description: 'View announcements' },
    { code: 'ANNOUNCEMENTS_CREATE', description: 'Create announcements' },
    { code: 'ANNOUNCEMENTS_EDIT', description: 'Edit announcements' },
    { code: 'ANNOUNCEMENTS_DELETE', description: 'Delete announcements' },
    { code: 'ANNOUNCEMENTS_ACK', description: 'Acknowledge announcements' },
    
    // Library
    { code: 'LIBRARY_VIEW', description: 'View library files' },
    { code: 'LIBRARY_CREATE', description: 'Create library files' },
    { code: 'LIBRARY_EDIT', description: 'Edit library files' },
    { code: 'LIBRARY_DELETE', description: 'Delete library files' },
    { code: 'LIBRARY_DOWNLOAD', description: 'Download library files' },
    
    // Subjects
    { code: 'SUBJECTS_VIEW', description: 'View subjects' },
    { code: 'SUBJECTS_CREATE', description: 'Create subjects' },
    { code: 'SUBJECTS_EDIT', description: 'Edit subjects' },
    { code: 'SUBJECTS_DELETE', description: 'Delete subjects' },
    
    // FAQ
    { code: 'FAQ_VIEW', description: 'View FAQ' },
    { code: 'FAQ_CREATE', description: 'Create FAQ questions' },
    { code: 'FAQ_EDIT', description: 'Edit FAQ' },
    { code: 'FAQ_DELETE', description: 'Delete FAQ' },
    { code: 'FAQ_ANSWER', description: 'Answer FAQ questions' },
    { code: 'FAQ_VOTE', description: 'Vote on FAQ' },
    
    // Contacts
    { code: 'CONTACTS_VIEW', description: 'View contacts' },
    { code: 'CONTACTS_CREATE', description: 'Create contacts' },
    { code: 'CONTACTS_EDIT', description: 'Edit contacts' },
    { code: 'CONTACTS_DELETE', description: 'Delete contacts' },
    
    // Access Requests
    { code: 'ACCESS_REQUESTS_VIEW', description: 'View access requests' },
    { code: 'ACCESS_REQUESTS_CREATE', description: 'Create access requests' },
    { code: 'ACCESS_REQUESTS_EDIT', description: 'Edit access requests' },
    { code: 'ACCESS_REQUESTS_APPROVE', description: 'Approve access requests' },
    { code: 'ACCESS_REQUESTS_BLOCK', description: 'Block access requests' },
    
    // Admin
    { code: 'ADMIN_USERS', description: 'Manage users' },
    { code: 'ADMIN_ROLES', description: 'Manage roles' },
    { code: 'ADMIN_POLICIES', description: 'Manage policies' },
    { code: 'ADMIN_AUDIT', description: 'View audit logs' },
    
    // System
    { code: 'SYSTEM_CONFIG', description: 'System configuration' },
    { code: 'SYSTEM_MAINTENANCE', description: 'System maintenance' }
  ]

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission
    })
  }

  console.log('✅ Permissions created')

  // Create roles
  const uknfAdminRole = await prisma.role.upsert({
    where: { name: 'UKNF_ADMIN' },
    update: {},
    create: {
      name: 'UKNF_ADMIN',
      description: 'UKNF Administrator - full access to all features'
    }
  })

  const uknfWorkerRole = await prisma.role.upsert({
    where: { name: 'UKNF_WORKER' },
    update: {},
    create: {
      name: 'UKNF_WORKER',
      description: 'UKNF Worker - limited access to communication features'
    }
  })

  const subjectAdminRole = await prisma.role.upsert({
    where: { name: 'SUBJECT_ADMIN' },
    update: {},
    create: {
      name: 'SUBJECT_ADMIN',
      description: 'Subject Administrator - full access to subject data'
    }
  })

  const subjectEmployeeRole = await prisma.role.upsert({
    where: { name: 'SUBJECT_EMPLOYEE' },
    update: {},
    create: {
      name: 'SUBJECT_EMPLOYEE',
      description: 'Subject Employee - limited access to subject data'
    }
  })

  console.log('✅ Roles created')

  // Assign permissions to roles
  const allPermissions = await prisma.permission.findMany()
  
  // UKNF Admin gets all permissions
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: uknfAdminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: uknfAdminRole.id,
        permissionId: permission.id
      }
    })
  }

  // UKNF Worker gets communication permissions
  const workerPermissions = allPermissions.filter((p: any) => 
    p.code.startsWith('COMMUNICATION_') ||
    p.code.startsWith('REPORTS_') ||
    p.code.startsWith('MESSAGES_') ||
    p.code.startsWith('CASES_') ||
    p.code.startsWith('ANNOUNCEMENTS_') ||
    p.code.startsWith('SUBJECTS_VIEW') ||
    p.code.startsWith('FAQ_') ||
    p.code.startsWith('CONTACTS_') ||
    p.code.startsWith('ACCESS_REQUESTS_')
  )

  for (const permission of workerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: uknfWorkerRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: uknfWorkerRole.id,
        permissionId: permission.id
      }
    })
  }

  // Subject Admin gets subject-related permissions
  const subjectAdminPermissions = allPermissions.filter((p: any) => 
    p.code.startsWith('COMMUNICATION_') ||
    p.code.startsWith('REPORTS_') ||
    p.code.startsWith('MESSAGES_') ||
    p.code.startsWith('CASES_') ||
    p.code.startsWith('ANNOUNCEMENTS_VIEW') ||
    p.code.startsWith('ANNOUNCEMENTS_ACK') ||
    p.code.startsWith('SUBJECTS_VIEW') ||
    p.code.startsWith('SUBJECTS_EDIT') ||
    p.code.startsWith('FAQ_') ||
    p.code.startsWith('CONTACTS_') ||
    p.code.startsWith('ACCESS_REQUESTS_')
  )

  for (const permission of subjectAdminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: subjectAdminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: subjectAdminRole.id,
        permissionId: permission.id
      }
    })
  }

  // Subject Employee gets limited permissions
  const subjectEmployeePermissions = allPermissions.filter((p: any) => 
    p.code.startsWith('COMMUNICATION_VIEW') ||
    p.code.startsWith('REPORTS_VIEW') ||
    p.code.startsWith('REPORTS_CREATE') ||
    p.code.startsWith('MESSAGES_VIEW') ||
    p.code.startsWith('MESSAGES_CREATE') ||
    p.code.startsWith('CASES_VIEW') ||
    p.code.startsWith('CASES_CREATE') ||
    p.code.startsWith('ANNOUNCEMENTS_VIEW') ||
    p.code.startsWith('ANNOUNCEMENTS_ACK') ||
    p.code.startsWith('SUBJECTS_VIEW') ||
    p.code.startsWith('FAQ_VIEW') ||
    p.code.startsWith('FAQ_VOTE') ||
    p.code.startsWith('CONTACTS_VIEW') ||
    p.code.startsWith('ACCESS_REQUESTS_VIEW') ||
    p.code.startsWith('ACCESS_REQUESTS_CREATE')
  )

  for (const permission of subjectEmployeePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: subjectEmployeeRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: subjectEmployeeRole.id,
        permissionId: permission.id
      }
    })
  }

  console.log('✅ Role permissions assigned')

  // Create demo users
  const hashedPassword = await hash('password123', 12)

  // UKNF Admin
  const uknfAdmin = await prisma.user.upsert({
    where: { email: 'admin@uknf.gov.pl' },
    update: {},
    create: {
      email: 'admin@uknf.gov.pl',
      hashedPassword,
      firstName: 'Jan',
      lastName: 'Kowalski',
      isInternal: true,
      isActive: true
    }
  })

  // UKNF Worker
  const uknfWorker = await prisma.user.upsert({
    where: { email: 'worker@uknf.gov.pl' },
    update: {},
    create: {
      email: 'worker@uknf.gov.pl',
      hashedPassword,
      firstName: 'Anna',
      lastName: 'Nowak',
      isInternal: true,
      isActive: true
    }
  })

  // Subject Admin
  const subjectAdmin = await prisma.user.upsert({
    where: { email: 'admin@bank.pl' },
    update: {},
    create: {
      email: 'admin@bank.pl',
      hashedPassword,
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      peselMasked: '*******1234',
      phone: '+48123456789',
      isInternal: false,
      isActive: true
    }
  })

  // Subject Employee
  const subjectEmployee = await prisma.user.upsert({
    where: { email: 'employee@bank.pl' },
    update: {},
    create: {
      email: 'employee@bank.pl',
      hashedPassword,
      firstName: 'Maria',
      lastName: 'Kowalczyk',
      peselMasked: '*******5678',
      phone: '+48987654321',
      isInternal: false,
      isActive: true
    }
  })

  console.log('✅ Demo users created')

  // Assign roles to users
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: uknfAdmin.id,
        roleId: uknfAdminRole.id
      }
    },
    update: {},
    create: {
      userId: uknfAdmin.id,
      roleId: uknfAdminRole.id
    }
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: uknfWorker.id,
        roleId: uknfWorkerRole.id
      }
    },
    update: {},
    create: {
      userId: uknfWorker.id,
      roleId: uknfWorkerRole.id
    }
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: subjectAdmin.id,
        roleId: subjectAdminRole.id
      }
    },
    update: {},
    create: {
      userId: subjectAdmin.id,
      roleId: subjectAdminRole.id
    }
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: subjectEmployee.id,
        roleId: subjectEmployeeRole.id
      }
    },
    update: {},
    create: {
      userId: subjectEmployee.id,
      roleId: subjectEmployeeRole.id
    }
  })

  console.log('✅ User roles assigned')

  // Create demo subjects
  const subjects = [
    {
      type: 'Bank',
      uknfCode: 'BANK001',
      name: 'Bank Polski Spółka Akcyjna',
      lei: '2138001A2B3C4D5E6F7G',
      nip: '1234567890',
      krs: '0000123456',
      street: 'ul. Marszałkowska',
      buildingNo: '100',
      postalCode: '00-001',
      city: 'Warszawa',
      phone: '+48221234567',
      email: 'kontakt@bankpolski.pl',
      status: 'Wpisany',
      category: 'Bank komercyjny',
      sector: 'Bankowość',
      subsector: 'Bankowość detaliczna'
    },
    {
      type: 'Instytucja Pożyczkowa',
      uknfCode: 'IP001',
      name: 'Pożyczka Plus Sp. z o.o.',
      lei: '2138002A2B3C4D5E6F7G',
      nip: '2345678901',
      krs: '0000234567',
      street: 'ul. Krakowskie Przedmieście',
      buildingNo: '50',
      postalCode: '00-002',
      city: 'Warszawa',
      phone: '+48229876543',
      email: 'biuro@pozyczkaplus.pl',
      status: 'Wpisany',
      category: 'Instytucja pożyczkowa',
      sector: 'Pożyczki',
      subsector: 'Pożyczki konsumenckie'
    },
    {
      type: 'Spółdzielcza Kasa Oszczędnościowo-Kredytowa',
      uknfCode: 'SKOK001',
      name: 'SKOK "Solidarność"',
      lei: '2138003A2B3C4D5E6F7G',
      nip: '3456789012',
      krs: '0000345678',
      street: 'ul. Nowy Świat',
      buildingNo: '25',
      postalCode: '00-003',
      city: 'Warszawa',
      phone: '+48225554433',
      email: 'info@skok-solidarnosc.pl',
      status: 'Wpisany',
      category: 'SKOK',
      sector: 'Spółdzielczość',
      subsector: 'Kasy oszczędnościowe'
    }
  ]

  for (const subjectData of subjects) {
    await prisma.subject.upsert({
      where: { nip: subjectData.nip },
      update: {},
      create: subjectData
    })
  }

  console.log('✅ Demo subjects created')

  // Create access requests for external users
  const bankSubject = await prisma.subject.findFirst({ where: { nip: '1234567890' } })
  const ipSubject = await prisma.subject.findFirst({ where: { nip: '2345678901' } })

  if (bankSubject) {
    // Subject admin access request
    await prisma.accessRequest.upsert({
      where: {
        userId_subjectId: {
          userId: subjectAdmin.id,
          subjectId: bankSubject.id
        }
      },
      update: {},
      create: {
        userId: subjectAdmin.id,
        subjectId: bankSubject.id,
        status: 'APPROVED',
        description: 'Administrator podmiotu nadzorowanego',
        lines: {
          create: [
            { permission: 'REPORTS_CREATE' },
            { permission: 'REPORTS_VIEW' },
            { permission: 'MESSAGES_CREATE' },
            { permission: 'MESSAGES_VIEW' },
            { permission: 'CASES_CREATE' },
            { permission: 'CASES_VIEW' },
            { permission: 'SUBJECTS_VIEW' },
            { permission: 'SUBJECTS_EDIT' }
          ]
        }
      }
    })

    // Subject employee access request
    await prisma.accessRequest.upsert({
      where: {
        userId_subjectId: {
          userId: subjectEmployee.id,
          subjectId: bankSubject.id
        }
      },
      update: {},
      create: {
        userId: subjectEmployee.id,
        subjectId: bankSubject.id,
        status: 'APPROVED',
        description: 'Pracownik podmiotu nadzorowanego',
        lines: {
          create: [
            { permission: 'REPORTS_CREATE' },
            { permission: 'REPORTS_VIEW' },
            { permission: 'MESSAGES_CREATE' },
            { permission: 'MESSAGES_VIEW' },
            { permission: 'CASES_CREATE' },
            { permission: 'CASES_VIEW' },
            { permission: 'SUBJECTS_VIEW' }
          ]
        }
      }
    })
  }

  console.log('✅ Access requests created')

  // Create demo announcements
  const announcements = [
    {
      title: 'Nowe wymagania sprawozdawcze na 2025 rok',
      content: 'Informujemy o wprowadzeniu nowych wymagań sprawozdawczych obowiązujących od 1 stycznia 2025 roku. Szczegóły dostępne w bibliotece dokumentów.',
      priority: 'HIGH',
      isRequired: true
    },
    {
      title: 'Aktualizacja systemu komunikacyjnego',
      content: 'W dniu 15 stycznia 2025 roku planowana jest aktualizacja systemu komunikacyjnego. System może być niedostępny w godzinach 2:00-4:00.',
      priority: 'MEDIUM',
      isRequired: false
    },
    {
      title: 'Szkolenie online dla nowych użytkowników',
      content: 'Zapraszamy na szkolenie online dla nowych użytkowników systemu, które odbędzie się 20 stycznia 2025 roku o godzinie 10:00.',
      priority: 'LOW',
      isRequired: false
    }
  ]

  for (const announcement of announcements) {
    await prisma.announcement.create({
      data: announcement
    })
  }

  console.log('✅ Demo announcements created')

  // Create demo FAQ questions
  const faqQuestions = [
    {
      title: 'Jak złożyć sprawozdanie?',
      content: 'Sprawozdanie można złożyć poprzez moduł Sprawozdania. Należy wybrać odpowiedni rejestr, okres sprawozdawczy i załączyć plik w formacie XLSX.',
      category: 'Sprawozdawczość',
      tags: ['sprawozdanie', 'xlsx', 'rejestr']
    },
    {
      title: 'Jakie formaty plików są akceptowane?',
      content: 'System akceptuje następujące formaty plików: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, MP3, ZIP. Maksymalny rozmiar pliku to 100 MB.',
      category: 'Pliki',
      tags: ['pliki', 'formaty', 'rozmiar']
    },
    {
      title: 'Jak skontaktować się z UKNF?',
      content: 'Z UKNF można skontaktować się poprzez moduł Wiadomości lub telefonicznie pod numerem +48 22 123 45 67.',
      category: 'Kontakt',
      tags: ['kontakt', 'wiadomości', 'telefon']
    }
  ]

  for (const question of faqQuestions) {
    await prisma.faqQuestion.create({
      data: {
        ...question,
        tags: JSON.stringify(question.tags)
      }
    })
  }

  console.log('✅ Demo FAQ questions created')

  // Create demo library files
  const libraryFiles = [
    {
      name: 'Wzór sprawozdania kwartalnego 2025',
      description: 'Wzór sprawozdania kwartalnego obowiązujący od 1 stycznia 2025 roku',
      category: 'Sprawozdania',
      period: '2025-Q1',
      updateDate: new Date('2025-01-01'),
      isPublic: true
    },
    {
      name: 'Instrukcja wypełniania sprawozdania',
      description: 'Szczegółowa instrukcja wypełniania sprawozdań kwartalnych',
      category: 'Instrukcje',
      isPublic: true
    },
    {
      name: 'Wzór sprawozdania rocznego 2024',
      description: 'Wzór sprawozdania rocznego za 2024 rok',
      category: 'Sprawozdania',
      period: '2024',
      updateDate: new Date('2024-12-31'),
      isPublic: true
    }
  ]

  for (const file of libraryFiles) {
    await prisma.libraryFile.create({
      data: file
    })
  }

  console.log('✅ Demo library files created')

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
