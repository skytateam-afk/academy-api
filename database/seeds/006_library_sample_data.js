/**
 * Library Sample Data Seed
 * Creates sample categories and items for testing
 */

exports.seed = async function(knex) {
  // Delete existing library data (in reverse order of dependencies)
  await knex('library_activity_log').del();
  await knex('library_reading_list_items').del();
  await knex('library_reading_lists').del();
  await knex('library_reviews').del();
  await knex('library_reservations').del();
  await knex('library_borrowing').del();
  await knex('library_items').del();
  await knex('library_categories').del();

  // Insert library categories
  const categories = await knex('library_categories').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Programming & Development',
      slug: 'programming-development',
      description: 'Books and resources about programming, software development, and computer science',
      icon: 'code',
      sort_order: 1,
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Web Development',
      slug: 'web-development',
      description: 'Frontend, backend, and full-stack web development resources',
      icon: 'globe',
      sort_order: 2,
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Data Science & AI',
      slug: 'data-science-ai',
      description: 'Machine learning, artificial intelligence, and data analysis',
      icon: 'chart',
      sort_order: 3,
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Business & Management',
      slug: 'business-management',
      description: 'Business strategy, management, and entrepreneurship',
      icon: 'briefcase',
      sort_order: 4,
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Design & UX',
      slug: 'design-ux',
      description: 'UI/UX design, graphic design, and creative resources',
      icon: 'palette',
      sort_order: 5,
      is_active: true
    }
  ]).returning('*');

  // Get admin user ID for added_by field
  const adminUser = await knex('users')
    .where({ email: 'admin@example.com' })
    .first();

  const addedBy = adminUser ? adminUser.id : null;

  // Insert library items
  await knex('library_items').insert([
    // Programming books
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      isbn: '978-0132350884',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publication_date: '2008-08-01',
      description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.',
      category_id: categories[0].id,
      item_type: 'book',
      format: 'both',
      language: 'en',
      total_copies: 5,
      available_copies: 5,
      location: 'Shelf A-12',
      tags: JSON.stringify(['programming', 'best practices', 'software engineering']),
      status: 'available',
      pages: 464,
      edition: '1st',
      is_featured: true,
      added_by: addedBy
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      isbn: '978-0201633610',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      publisher: 'Addison-Wesley',
      publication_date: '1994-10-31',
      description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.',
      category_id: categories[0].id,
      item_type: 'book',
      format: 'physical',
      language: 'en',
      total_copies: 3,
      available_copies: 3,
      location: 'Shelf A-15',
      tags: JSON.stringify(['design patterns', 'OOP', 'software architecture']),
      status: 'available',
      pages: 416,
      edition: '1st',
      is_featured: true,
      added_by: addedBy
    },
    // Web Development books
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'JavaScript: The Good Parts',
      isbn: '978-0596517748',
      author: 'Douglas Crockford',
      publisher: 'O\'Reilly Media',
      publication_date: '2008-05-08',
      description: 'Most programming languages contain good and bad parts, but JavaScript has more than its share of the bad, having been developed and released in a hurry before it could be refined.',
      category_id: categories[1].id,
      item_type: 'book',
      format: 'both',
      language: 'en',
      total_copies: 4,
      available_copies: 4,
      location: 'Shelf B-08',
      tags: JSON.stringify(['javascript', 'web development', 'programming']),
      status: 'available',
      pages: 176,
      edition: '1st',
      is_featured: false,
      added_by: addedBy
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Full Stack Vue.js, Node.js and MongoDB',
      isbn: '978-1484253366',
      author: 'Xhevdet Selmani',
      publisher: 'Apress',
      publication_date: '2019-12-15',
      description: 'Learn how to build a full stack application using Vue.js for frontend, Node.js for backend and MongoDB for database.',
      category_id: categories[1].id,
      item_type: 'ebook',
      format: 'digital',
      language: 'en',
      total_copies: 1,
      available_copies: 1,
      tags: JSON.stringify(['vue', 'nodejs', 'mongodb', 'full stack']),
      status: 'available',
      pages: 342,
      edition: '1st',
      is_featured: true,
      added_by: addedBy
    },
    // Data Science books
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Python Machine Learning',
      isbn: '978-1789955750',
      author: 'Sebastian Raschka, Vahid Mirjalili',
      publisher: 'Packt Publishing',
      publication_date: '2019-12-12',
      description: 'Python Machine Learning, Third Edition is a comprehensive guide to machine learning and deep learning with Python.',
      category_id: categories[2].id,
      item_type: 'book',
      format: 'both',
      language: 'en',
      total_copies: 6,
      available_copies: 6,
      location: 'Shelf C-05',
      tags: JSON.stringify(['python', 'machine learning', 'data science']),
      status: 'available',
      pages: 770,
      edition: '3rd',
      is_featured: true,
      added_by: addedBy
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Deep Learning with Python',
      isbn: '978-1617294433',
      author: 'François Chollet',
      publisher: 'Manning Publications',
      publication_date: '2017-12-18',
      description: 'Deep Learning with Python introduces the field of deep learning using the Python language and the powerful Keras library.',
      category_id: categories[2].id,
      item_type: 'book',
      format: 'physical',
      language: 'en',
      total_copies: 4,
      available_copies: 4,
      location: 'Shelf C-08',
      tags: JSON.stringify(['deep learning', 'python', 'keras', 'neural networks']),
      status: 'available',
      pages: 384,
      edition: '1st',
      is_featured: false,
      added_by: addedBy
    },
    // Business books
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'The Lean Startup',
      isbn: '978-0307887894',
      author: 'Eric Ries',
      publisher: 'Crown Business',
      publication_date: '2011-09-13',
      description: 'Most startups fail. But many of those failures are preventable. The Lean Startup is a new approach being adopted around the world.',
      category_id: categories[3].id,
      item_type: 'book',
      format: 'both',
      language: 'en',
      total_copies: 5,
      available_copies: 5,
      location: 'Shelf D-10',
      tags: JSON.stringify(['entrepreneurship', 'startups', 'business']),
      status: 'available',
      pages: 336,
      edition: '1st',
      is_featured: true,
      added_by: addedBy
    },
    // Design books
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'Don\'t Make Me Think, Revisited',
      isbn: '978-0321965516',
      author: 'Steve Krug',
      publisher: 'New Riders',
      publication_date: '2013-12-23',
      description: 'Since Don\'t Make Me Think was first published in 2000, hundreds of thousands of Web designers and developers have relied on usability guru Steve Krug\'s guide.',
      category_id: categories[4].id,
      item_type: 'book',
      format: 'physical',
      language: 'en',
      total_copies: 3,
      available_copies: 3,
      location: 'Shelf E-05',
      tags: JSON.stringify(['UX', 'usability', 'web design']),
      status: 'available',
      pages: 216,
      edition: '3rd',
      is_featured: true,
      added_by: addedBy
    },
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'The Design of Everyday Things',
      isbn: '978-0465050659',
      author: 'Donald A. Norman',
      publisher: 'Basic Books',
      publication_date: '2013-11-05',
      description: 'Even the smartest among us can feel inept as we fail to figure out which light switch or oven burner to turn on.',
      category_id: categories[4].id,
      item_type: 'book',
      format: 'both',
      language: 'en',
      total_copies: 4,
      available_copies: 4,
      location: 'Shelf E-08',
      tags: JSON.stringify(['design', 'user experience', 'product design']),
      status: 'available',
      pages: 368,
      edition: 'Revised',
      is_featured: false,
      added_by: addedBy
    },
    // Additional diverse items
    {
      id: knex.raw('gen_random_uuid()'),
      title: 'JavaScript Video Tutorial Series',
      author: 'Multiple Authors',
      publisher: 'Online Platform',
      publication_date: '2023-01-01',
      description: 'Comprehensive video series covering JavaScript from basics to advanced topics.',
      category_id: categories[1].id,
      item_type: 'video',
      format: 'digital',
      language: 'en',
      total_copies: 1,
      available_copies: 1,
      tags: JSON.stringify(['javascript', 'video', 'tutorial']),
      status: 'available',
      is_featured: false,
      added_by: addedBy
    }
  ]);

  console.log('✓ Library sample data seeded successfully');
  console.log(`  - ${categories.length} categories created`);
  console.log(`  - 10 library items created`);
};
