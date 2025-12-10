/**
 * Sample Data Seed
 * Populates the database with realistic sample data for testing and demonstration
 */

const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  console.log('🌱 Starting sample data seeding...');

  try {
    // Check if sample data already exists
    const existingUsers = await knex('users').where('username', 'like', 'sample_%').count('* as count').first();
    if (existingUsers && parseInt(existingUsers.count) > 0) {
      console.log('ℹ️  Sample data already exists. Skipping seed.');
      console.log('💡 To re-seed, first delete existing sample data or reset the database.');
      return;
    }

    // Get role IDs
    const roles = await knex('roles').select('id', 'name');
    const studentRoleId = roles.find(r => r.name === 'student')?.id;
    const instructorRoleId = roles.find(r => r.name === 'instructor')?.id;

    if (!studentRoleId || !instructorRoleId) {
      throw new Error('Required roles not found. Please run initial seed first.');
    }

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 1. Create Sample Users (50 students, 10 instructors)
    console.log('Creating sample users...');
    
    const students = [];
    const instructors = [];

    // Create students with unique prefix
    for (let i = 1; i <= 50; i++) {
      const createdDaysAgo = Math.floor(Math.random() * 90); // Random date in last 90 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);

      students.push({
        username: `sample_student${i}`,
        email: `sample.student${i}@example.com`,
        password_hash: hashedPassword,
        first_name: `Student`,
        last_name: `${i}`,
        role_id: studentRoleId,
        is_active: true,
        is_verified: true,
        created_at: createdAt,
        updated_at: createdAt
      });
    }

    // Create instructors
    const instructorNames = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
      'David Wilson', 'Lisa Anderson', 'James Taylor', 'Jennifer Martinez',
      'Robert Garcia', 'Mary Rodriguez', 'Christopher Lee', 'Patricia White',
      'Daniel Harris', 'Nancy Clark', 'Matthew Lewis', 'Karen Walker',
      'Anthony Hall', 'Betty Allen', 'Mark Young', 'Sandra King'
    ];

    for (let i = 1; i <= 20; i++) {
      const [firstName, lastName] = instructorNames[i - 1].split(' ');
      const createdDaysAgo = Math.floor(Math.random() * 180); // Random date in last 180 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);

      instructors.push({
        username: `sample_instructor${i}`,
        email: `sample.instructor${i}@example.com`,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role_id: instructorRoleId,
        is_active: true,
        is_verified: true,
        bio: `Experienced educator with expertise in various subjects. Passionate about helping students succeed.`,
        created_at: createdAt,
        updated_at: createdAt
      });
    }

    // Insert all users (no additional admins - use existing ones)
    const allUsers = [...students, ...instructors];
    await knex('users').insert(allUsers);
    console.log(`✓ Created ${allUsers.length} users`);

    // Get inserted user IDs
    const insertedStudents = await knex('users')
      .whereIn('username', students.map(s => s.username))
      .select('id', 'username');
    
    const insertedInstructors = await knex('users')
      .whereIn('username', instructors.map(i => i.username))
      .select('id', 'username', 'first_name', 'last_name');

    // 2. Create Categories (check if they exist first)
    console.log('Creating categories...');
    const existingCategories = await knex('categories').select('id', 'name', 'slug');
    
    const categories = [
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Learn to build modern web applications',
        icon_url: '🌐',
        display_order: 1,
        is_active: true
      },
      {
        name: 'Data Science',
        slug: 'data-science',
        description: 'Master data analysis and machine learning',
        icon_url: '📊',
        display_order: 2,
        is_active: true
      },
      {
        name: 'Mobile Development',
        slug: 'mobile-development',
        description: 'Build iOS and Android applications',
        icon_url: '📱',
        display_order: 3,
        is_active: true
      },
      {
        name: 'Cloud Computing',
        slug: 'cloud-computing',
        description: 'Learn cloud platforms and DevOps',
        icon_url: '☁️',
        display_order: 4,
        is_active: true
      },
      {
        name: 'Cybersecurity',
        slug: 'cybersecurity',
        description: 'Protect systems and networks',
        icon_url: '🔒',
        display_order: 5,
        is_active: true
      },
      {
        name: 'Artificial Intelligence',
        slug: 'artificial-intelligence',
        description: 'Explore AI and deep learning',
        icon_url: '🤖',
        display_order: 6,
        is_active: true
      },
      {
        name: 'Business & Marketing',
        slug: 'business-marketing',
        description: 'Grow your business skills',
        icon_url: '💼',
        display_order: 7,
        is_active: true
      },
      {
        name: 'Design',
        slug: 'design',
        description: 'UI/UX and graphic design',
        icon_url: '🎨',
        display_order: 8,
        is_active: true
      }
    ];

    // Only insert categories that don't exist
    const categoriesToInsert = categories.filter(cat => 
      !existingCategories.find(existing => existing.slug === cat.slug)
    );
    
    if (categoriesToInsert.length > 0) {
      await knex('categories').insert(categoriesToInsert);
      console.log(`✓ Created ${categoriesToInsert.length} new categories`);
    } else {
      console.log(`ℹ️  All categories already exist`);
    }

    const insertedCategories = await knex('categories').select('id', 'name', 'slug');

    // 3. Create Courses (100 courses)
    console.log('Creating courses...');
    const coursesData = [
      // Web Development (13 courses)
      { title: 'Complete Web Development Bootcamp', category: 'web-development', level: 'beginner', price: 99.99, duration: 40 },
      { title: 'Advanced JavaScript Mastery', category: 'web-development', level: 'advanced', price: 149.99, duration: 30 },
      { title: 'React & Redux Complete Guide', category: 'web-development', level: 'intermediate', price: 129.99, duration: 35 },
      { title: 'Node.js Backend Development', category: 'web-development', level: 'intermediate', price: 119.99, duration: 28 },
      { title: 'Full Stack MERN Development', category: 'web-development', level: 'advanced', price: 179.99, duration: 50 },
      { title: 'Vue.js 3 Complete Course', category: 'web-development', level: 'intermediate', price: 119.99, duration: 32 },
      { title: 'TypeScript for Beginners', category: 'web-development', level: 'beginner', price: 89.99, duration: 24 },
      { title: 'Next.js & Server-Side Rendering', category: 'web-development', level: 'advanced', price: 159.99, duration: 38 },
      { title: 'GraphQL API Development', category: 'web-development', level: 'intermediate', price: 139.99, duration: 30 },
      { title: 'HTML5 & CSS3 Fundamentals', category: 'web-development', level: 'beginner', price: 69.99, duration: 20 },
      { title: 'Responsive Web Design Mastery', category: 'web-development', level: 'intermediate', price: 99.99, duration: 26 },
      { title: 'Progressive Web Apps (PWA)', category: 'web-development', level: 'advanced', price: 149.99, duration: 34 },
      { title: 'Web Performance Optimization', category: 'web-development', level: 'advanced', price: 129.99, duration: 28 },
      
      // Data Science (13 courses)
      { title: 'Python for Data Science', category: 'data-science', level: 'beginner', price: 89.99, duration: 32 },
      { title: 'Machine Learning A-Z', category: 'data-science', level: 'intermediate', price: 159.99, duration: 45 },
      { title: 'Deep Learning Specialization', category: 'data-science', level: 'advanced', price: 199.99, duration: 60 },
      { title: 'Data Analysis with Pandas', category: 'data-science', level: 'beginner', price: 79.99, duration: 25 },
      { title: 'Statistical Analysis with R', category: 'data-science', level: 'intermediate', price: 119.99, duration: 35 },
      { title: 'Big Data Analytics with Spark', category: 'data-science', level: 'advanced', price: 179.99, duration: 48 },
      { title: 'Data Visualization with Tableau', category: 'data-science', level: 'beginner', price: 89.99, duration: 22 },
      { title: 'SQL for Data Analysis', category: 'data-science', level: 'beginner', price: 69.99, duration: 20 },
      { title: 'Time Series Analysis', category: 'data-science', level: 'intermediate', price: 139.99, duration: 32 },
      { title: 'Neural Networks from Scratch', category: 'data-science', level: 'advanced', price: 189.99, duration: 52 },
      { title: 'Data Mining Techniques', category: 'data-science', level: 'intermediate', price: 129.99, duration: 38 },
      { title: 'Predictive Analytics', category: 'data-science', level: 'advanced', price: 169.99, duration: 44 },
      { title: 'Business Intelligence Fundamentals', category: 'data-science', level: 'beginner', price: 99.99, duration: 28 },
      
      // Mobile Development (12 courses)
      { title: 'iOS Development with Swift', category: 'mobile-development', level: 'intermediate', price: 139.99, duration: 38 },
      { title: 'Android Development Masterclass', category: 'mobile-development', level: 'intermediate', price: 139.99, duration: 40 },
      { title: 'React Native - Build Mobile Apps', category: 'mobile-development', level: 'intermediate', price: 129.99, duration: 35 },
      { title: 'Flutter & Dart Complete Guide', category: 'mobile-development', level: 'beginner', price: 109.99, duration: 30 },
      { title: 'SwiftUI for iOS Development', category: 'mobile-development', level: 'intermediate', price: 149.99, duration: 36 },
      { title: 'Kotlin for Android Development', category: 'mobile-development', level: 'intermediate', price: 129.99, duration: 34 },
      { title: 'Mobile App Design Principles', category: 'mobile-development', level: 'beginner', price: 79.99, duration: 22 },
      { title: 'Cross-Platform Development', category: 'mobile-development', level: 'advanced', price: 159.99, duration: 42 },
      { title: 'Mobile Game Development', category: 'mobile-development', level: 'intermediate', price: 139.99, duration: 38 },
      { title: 'iOS App Publishing Guide', category: 'mobile-development', level: 'beginner', price: 69.99, duration: 18 },
      { title: 'Android Jetpack Compose', category: 'mobile-development', level: 'advanced', price: 149.99, duration: 36 },
      { title: 'Mobile App Testing & QA', category: 'mobile-development', level: 'intermediate', price: 119.99, duration: 28 },
      
      // Cloud Computing (13 courses)
      { title: 'AWS Certified Solutions Architect', category: 'cloud-computing', level: 'intermediate', price: 149.99, duration: 42 },
      { title: 'Docker & Kubernetes Mastery', category: 'cloud-computing', level: 'advanced', price: 169.99, duration: 38 },
      { title: 'Azure Cloud Fundamentals', category: 'cloud-computing', level: 'beginner', price: 99.99, duration: 28 },
      { title: 'DevOps Engineering Complete Course', category: 'cloud-computing', level: 'advanced', price: 189.99, duration: 55 },
      { title: 'Google Cloud Platform Essentials', category: 'cloud-computing', level: 'beginner', price: 109.99, duration: 30 },
      { title: 'Terraform Infrastructure as Code', category: 'cloud-computing', level: 'intermediate', price: 139.99, duration: 34 },
      { title: 'CI/CD Pipeline Automation', category: 'cloud-computing', level: 'intermediate', price: 129.99, duration: 32 },
      { title: 'Serverless Architecture', category: 'cloud-computing', level: 'advanced', price: 159.99, duration: 40 },
      { title: 'Cloud Security Best Practices', category: 'cloud-computing', level: 'advanced', price: 179.99, duration: 44 },
      { title: 'Microservices Architecture', category: 'cloud-computing', level: 'advanced', price: 169.99, duration: 46 },
      { title: 'AWS Lambda & Serverless', category: 'cloud-computing', level: 'intermediate', price: 119.99, duration: 28 },
      { title: 'Cloud Cost Optimization', category: 'cloud-computing', level: 'intermediate', price: 99.99, duration: 24 },
      { title: 'Multi-Cloud Strategy', category: 'cloud-computing', level: 'advanced', price: 189.99, duration: 48 },
      
      // Cybersecurity (12 courses)
      { title: 'Ethical Hacking from Scratch', category: 'cybersecurity', level: 'beginner', price: 119.99, duration: 35 },
      { title: 'Network Security Fundamentals', category: 'cybersecurity', level: 'intermediate', price: 129.99, duration: 32 },
      { title: 'Penetration Testing Bootcamp', category: 'cybersecurity', level: 'advanced', price: 179.99, duration: 48 },
      { title: 'Web Application Security', category: 'cybersecurity', level: 'intermediate', price: 139.99, duration: 36 },
      { title: 'Cryptography & Encryption', category: 'cybersecurity', level: 'advanced', price: 159.99, duration: 40 },
      { title: 'Security Operations Center (SOC)', category: 'cybersecurity', level: 'intermediate', price: 149.99, duration: 38 },
      { title: 'Incident Response & Forensics', category: 'cybersecurity', level: 'advanced', price: 169.99, duration: 44 },
      { title: 'Malware Analysis', category: 'cybersecurity', level: 'advanced', price: 179.99, duration: 46 },
      { title: 'Security Compliance & Auditing', category: 'cybersecurity', level: 'intermediate', price: 129.99, duration: 32 },
      { title: 'Wireless Network Security', category: 'cybersecurity', level: 'intermediate', price: 119.99, duration: 28 },
      { title: 'Cloud Security Engineering', category: 'cybersecurity', level: 'advanced', price: 189.99, duration: 50 },
      { title: 'Security Awareness Training', category: 'cybersecurity', level: 'beginner', price: 79.99, duration: 20 },
      
      // Artificial Intelligence (12 courses)
      { title: 'Artificial Intelligence Fundamentals', category: 'artificial-intelligence', level: 'beginner', price: 109.99, duration: 30 },
      { title: 'Natural Language Processing', category: 'artificial-intelligence', level: 'advanced', price: 189.99, duration: 45 },
      { title: 'Computer Vision with OpenCV', category: 'artificial-intelligence', level: 'intermediate', price: 149.99, duration: 38 },
      { title: 'Reinforcement Learning', category: 'artificial-intelligence', level: 'advanced', price: 199.99, duration: 52 },
      { title: 'Generative AI & ChatGPT', category: 'artificial-intelligence', level: 'intermediate', price: 159.99, duration: 36 },
      { title: 'AI Ethics & Responsible AI', category: 'artificial-intelligence', level: 'beginner', price: 89.99, duration: 24 },
      { title: 'TensorFlow & Keras Mastery', category: 'artificial-intelligence', level: 'intermediate', price: 169.99, duration: 42 },
      { title: 'PyTorch Deep Learning', category: 'artificial-intelligence', level: 'advanced', price: 179.99, duration: 48 },
      { title: 'AI for Business Applications', category: 'artificial-intelligence', level: 'beginner', price: 99.99, duration: 28 },
      { title: 'Speech Recognition Systems', category: 'artificial-intelligence', level: 'advanced', price: 189.99, duration: 44 },
      { title: 'AI Model Deployment', category: 'artificial-intelligence', level: 'intermediate', price: 139.99, duration: 34 },
      { title: 'Robotics & AI Integration', category: 'artificial-intelligence', level: 'advanced', price: 199.99, duration: 56 },
      
      // Business & Marketing (12 courses)
      { title: 'Digital Marketing Masterclass', category: 'business-marketing', level: 'beginner', price: 79.99, duration: 25 },
      { title: 'SEO & Content Marketing', category: 'business-marketing', level: 'intermediate', price: 89.99, duration: 28 },
      { title: 'Social Media Marketing Strategy', category: 'business-marketing', level: 'beginner', price: 69.99, duration: 20 },
      { title: 'Email Marketing Automation', category: 'business-marketing', level: 'intermediate', price: 99.99, duration: 26 },
      { title: 'Growth Hacking Strategies', category: 'business-marketing', level: 'advanced', price: 129.99, duration: 32 },
      { title: 'Brand Management & Strategy', category: 'business-marketing', level: 'intermediate', price: 109.99, duration: 30 },
      { title: 'E-commerce Business Mastery', category: 'business-marketing', level: 'beginner', price: 89.99, duration: 28 },
      { title: 'Product Management Fundamentals', category: 'business-marketing', level: 'intermediate', price: 119.99, duration: 34 },
      { title: 'Startup & Entrepreneurship', category: 'business-marketing', level: 'beginner', price: 99.99, duration: 30 },
      { title: 'Business Analytics & Metrics', category: 'business-marketing', level: 'intermediate', price: 129.99, duration: 32 },
      { title: 'Influencer Marketing', category: 'business-marketing', level: 'beginner', price: 79.99, duration: 22 },
      { title: 'Sales Funnel Optimization', category: 'business-marketing', level: 'advanced', price: 139.99, duration: 36 },
      
      // Design (13 courses)
      { title: 'UI/UX Design Bootcamp', category: 'design', level: 'beginner', price: 99.99, duration: 32 },
      { title: 'Figma Complete Course', category: 'design', level: 'beginner', price: 79.99, duration: 24 },
      { title: 'Advanced Graphic Design', category: 'design', level: 'intermediate', price: 119.99, duration: 35 },
      { title: 'Motion Graphics & Animation', category: 'design', level: 'advanced', price: 149.99, duration: 40 },
      { title: 'Adobe Photoshop Mastery', category: 'design', level: 'intermediate', price: 109.99, duration: 30 },
      { title: 'Adobe Illustrator Complete Guide', category: 'design', level: 'intermediate', price: 109.99, duration: 28 },
      { title: 'Web Design Fundamentals', category: 'design', level: 'beginner', price: 89.99, duration: 26 },
      { title: 'User Research & Testing', category: 'design', level: 'intermediate', price: 119.99, duration: 32 },
      { title: 'Design Systems & Components', category: 'design', level: 'advanced', price: 139.99, duration: 36 },
      { title: '3D Design with Blender', category: 'design', level: 'intermediate', price: 129.99, duration: 38 },
      { title: 'Typography & Layout Design', category: 'design', level: 'beginner', price: 79.99, duration: 22 },
      { title: 'Mobile UI Design Patterns', category: 'design', level: 'intermediate', price: 99.99, duration: 28 },
      { title: 'Branding & Logo Design', category: 'design', level: 'beginner', price: 89.99, duration: 24 }
    ];

    const courses = [];
    for (let i = 0; i < coursesData.length; i++) {
      const courseData = coursesData[i];
      const category = insertedCategories.find(c => c.slug === courseData.category);
      const instructor = insertedInstructors[i % insertedInstructors.length];
      
      const createdDaysAgo = Math.floor(Math.random() * 120);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);

      const slug = courseData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      courses.push({
        title: courseData.title,
        slug: slug,
        description: `Master ${courseData.title.toLowerCase()} with this comprehensive course. Learn from industry experts and build real-world projects.`,
        short_description: `Learn ${courseData.title.toLowerCase()} from scratch to advanced level.`,
        category_id: category.id,
        instructor_id: instructor.id,
        level: courseData.level,
        language: 'en',
        duration_hours: courseData.duration,
        price: courseData.price,
        currency: 'USD',
        is_published: true,
        is_featured: Math.random() > 0.7, // 30% chance of being featured
        published_at: createdAt,
        rating_average: (3.5 + Math.random() * 1.5).toFixed(2), // 3.5 to 5.0
        rating_count: Math.floor(Math.random() * 200) + 50,
        view_count: Math.floor(Math.random() * 5000) + 500,
        created_at: createdAt,
        updated_at: createdAt
      });
    }

    await knex('courses').insert(courses);
    console.log(`✓ Created ${courses.length} courses`);

    const insertedCourses = await knex('courses').select('id', 'title', 'price');

    // 4. Create Enrollments (distribute students across courses)
    console.log('Creating enrollments...');
    const enrollments = [];
    const transactions = [];

    for (const student of insertedStudents) {
      // Each student enrolls in 1-5 random courses
      const numEnrollments = Math.floor(Math.random() * 5) + 1;
      const selectedCourses = [];
      
      while (selectedCourses.length < numEnrollments) {
        const randomCourse = insertedCourses[Math.floor(Math.random() * insertedCourses.length)];
        if (!selectedCourses.find(c => c.id === randomCourse.id)) {
          selectedCourses.push(randomCourse);
        }
      }

      for (const course of selectedCourses) {
        const enrolledDaysAgo = Math.floor(Math.random() * 60);
        const enrolledAt = new Date();
        enrolledAt.setDate(enrolledAt.getDate() - enrolledDaysAgo);

        // Create transaction first
        const transaction = {
          user_id: student.id,
          course_id: course.id,
          amount: course.price,
          currency: 'USD',
          payment_method: ['stripe', 'paystack'][Math.floor(Math.random() * 2)],
          payment_provider: 'stripe',
          provider_transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'completed',
          paid_at: enrolledAt,
          created_at: enrolledAt,
          updated_at: enrolledAt
        };

        transactions.push(transaction);
      }
    }

    // Insert transactions first
    await knex('transactions').insert(transactions);
    console.log(`✓ Created ${transactions.length} transactions`);

    // Get transaction IDs
    const insertedTransactions = await knex('transactions')
      .select('id', 'user_id', 'course_id', 'created_at');

    // Create enrollments with transaction references
    for (const transaction of insertedTransactions) {
      const progress = Math.random() * 100;
      const isCompleted = progress > 95;
      
      const enrollment = {
        user_id: transaction.user_id,
        course_id: transaction.course_id,
        transaction_id: transaction.id,
        enrollment_type: 'paid',
        enrolled_at: transaction.created_at,
        started_at: transaction.created_at,
        completed_at: isCompleted ? new Date() : null,
        progress_percent: progress.toFixed(2),
        last_accessed_at: new Date(),
        status: isCompleted ? 'completed' : 'active'
      };

      enrollments.push(enrollment);
    }

    await knex('enrollments').insert(enrollments);
    console.log(`✓ Created ${enrollments.length} enrollments`);

    // 5. Create Course Reviews
    console.log('Creating course reviews...');
    
    // Get inserted enrollments with IDs
    const insertedEnrollments = await knex('enrollments')
      .whereIn('user_id', insertedStudents.map(s => s.id))
      .select('id', 'user_id', 'course_id');
    
    const reviews = [];
    
    // 30% of enrollments get reviews
    const enrollmentsToReview = insertedEnrollments.filter(() => Math.random() > 0.7);
    
    for (const enrollment of enrollmentsToReview) {
      const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
      const reviewTexts = [
        'Excellent course! Learned a lot and the instructor was very clear.',
        'Great content and well-structured. Highly recommend!',
        'Very informative and practical. Worth every penny.',
        'Good course overall. Some sections could be more detailed.',
        'Amazing instructor and great examples. Will take more courses!',
        'Solid course with good pacing. Enjoyed the hands-on projects.',
        'Clear explanations and helpful resources. Very satisfied.',
        'Comprehensive coverage of the topic. Great for beginners.',
        'Instructor knows the subject well. Good value for money.',
        'Practical and engaging. Helped me land a job!'
      ];

      reviews.push({
        user_id: enrollment.user_id,
        course_id: enrollment.course_id,
        enrollment_id: enrollment.id,
        rating: rating,
        review_text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        is_published: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (reviews.length > 0) {
      await knex('course_reviews').insert(reviews);
      console.log(`✓ Created ${reviews.length} course reviews`);
    }

    // 6. Create Lessons for each course (5-10 lessons per course)
    console.log('Creating lessons...');
    const lessons = [];
    
    for (const course of insertedCourses) {
      const numLessons = Math.floor(Math.random() * 6) + 5; // 5-10 lessons
      
      for (let i = 1; i <= numLessons; i++) {
        const lessonTitles = [
          'Introduction and Overview',
          'Getting Started',
          'Core Concepts',
          'Advanced Techniques',
          'Best Practices',
          'Real-World Examples',
          'Common Pitfalls',
          'Project Setup',
          'Building the Application',
          'Testing and Deployment',
          'Performance Optimization',
          'Security Considerations',
          'Final Project',
          'Conclusion and Next Steps'
        ];

        const title = lessonTitles[i - 1] || `Lesson ${i}`;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        lessons.push({
          course_id: course.id,
          title: title,
          slug: slug,
          description: `In this lesson, you'll learn about ${title.toLowerCase()}.`,
          content_type: ['video', 'text', 'mixed'][Math.floor(Math.random() * 3)],
          video_duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
          display_order: i,
          is_preview: i === 1, // First lesson is preview
          is_published: true,
          duration_minutes: Math.floor(Math.random() * 30) + 10,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    await knex('lessons').insert(lessons);
    console.log(`✓ Created ${lessons.length} lessons`);

    // 7. Create Notifications for users
    console.log('Creating notifications...');
    const notifications = [];
    
    for (const student of insertedStudents.slice(0, 20)) { // First 20 students
      const notificationTypes = [
        { type: 'enrollment', title: 'Welcome to your new course!', message: 'Start learning today and achieve your goals.' },
        { type: 'course_update', title: 'New lesson added', message: 'Check out the latest content in your course.' },
        { type: 'achievement', title: 'Congratulations!', message: 'You completed 50% of the course.' },
        { type: 'reminder', title: 'Continue your learning', message: 'You haven\'t visited your course in a while.' }
      ];

      const notification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      
      notifications.push({
        user_id: student.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        is_read: Math.random() > 0.5,
        read_at: Math.random() > 0.5 ? new Date() : null,
        created_at: new Date()
      });
    }

    await knex('notifications').insert(notifications);
    console.log(`✓ Created ${notifications.length} notifications`);

    console.log('\n✅ Sample data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${allUsers.length} (${students.length} students, ${instructors.length} instructors)`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Enrollments: ${enrollments.length}`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Lessons: ${lessons.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log('\n🔑 Sample Login credentials:');
    console.log('   Instructor: sample.instructor1@example.com / Password123!');
    console.log('   Student: sample.student1@example.com / Password123!');

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    throw error;
  }
};
