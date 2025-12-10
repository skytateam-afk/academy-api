/**
 * Bulk Library Data Seed
 * Creates 100+ library items with various types (books, ebooks, audiobooks)
 */

exports.seed = async function(knex) {
  // Get admin user
  const adminUsers = await knex('users')
    .where('email', 'like', '%admin%')
    .limit(1);
  
  if (adminUsers.length === 0) {
    console.log('⚠ No admin user found, skipping library bulk data seed');
    return;
  }

  const adminId = adminUsers[0].id;

  // Get categories
  const categories = await knex('library_categories').select('id', 'name');
  
  if (categories.length === 0) {
    console.log('⚠ No categories found, skipping library bulk data seed');
    return;
  }

  // Helper function to get random category
  const getRandomCategory = () => categories[Math.floor(Math.random() * categories.length)].id;

  // Helper function to get random number in range
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Sample data arrays
  const bookTitles = [
    // Programming & Technology
    'Clean Code: A Handbook of Agile Software Craftsmanship',
    'Design Patterns: Elements of Reusable Object-Oriented Software',
    'Introduction to Algorithms',
    'The Pragmatic Programmer',
    'Code Complete',
    'Refactoring: Improving the Design of Existing Code',
    'Head First Design Patterns',
    'JavaScript: The Good Parts',
    'Python Crash Course',
    'Learning React',
    'Vue.js Up and Running',
    'Node.js Design Patterns',
    'Database System Concepts',
    'Computer Networks',
    'Operating System Concepts',
    'Artificial Intelligence: A Modern Approach',
    'Deep Learning',
    'Machine Learning Yearning',
    'Data Science from Scratch',
    'The Art of Computer Programming',
    
    // Business & Management
    'Good to Great',
    'The Lean Startup',
    'Zero to One',
    'The Innovators Dilemma',
    'Built to Last',
    'The Hard Thing About Hard Things',
    'The E-Myth Revisited',
    'Start with Why',
    'Thinking, Fast and Slow',
    'Influence: The Psychology of Persuasion',
    'The 7 Habits of Highly Effective People',
    'How to Win Friends and Influence People',
    'The 48 Laws of Power',
    'Rich Dad Poor Dad',
    'The Intelligent Investor',
    'The Warren Buffett Way',
    'The Essays of Warren Buffett',
    'A Random Walk Down Wall Street',
    'The Black Swan',
    'Antifragile',
    
    // Science & Mathematics
    'A Brief History of Time',
    'The Selfish Gene',
    'Cosmos',
    'The Origin of Species',
    'Sapiens: A Brief History of Humankind',
    'Homo Deus',
    '21 Lessons for the 21st Century',
    'The Structure of Scientific Revolutions',
    'Gödel, Escher, Bach',
    'Fermats Last Theorem',
    'The Man Who Knew Infinity',
    'Surely Youre Joking, Mr. Feynman!',
    'The Double Helix',
    'The Emperor of All Maladies',
    'The Gene: An Intimate History',
    'The Immortal Life of Henrietta Lacks',
    'The Hidden Life of Trees',
    'Entangled Life',
    'Other Minds: The Octopus',
    'The Body: A Guide for Occupants',
    
    // Literature & Fiction
    'To Kill a Mockingbird',
    '1984',
    'Pride and Prejudice',
    'The Great Gatsby',
    'One Hundred Years of Solitude',
    'The Catcher in the Rye',
    'Animal Farm',
    'Lord of the Flies',
    'The Grapes of Wrath',
    'Brave New World',
    'Fahrenheit 451',
    'The Handmaids Tale',
    'Slaughterhouse-Five',
    'Catch-22',
    'The Bell Jar',
    'Beloved',
    'Things Fall Apart',
    'Their Eyes Were Watching God',
    'The Color Purple',
    'The Kite Runner',
    
    // History & Biography
    'Team of Rivals',
    'The Rise and Fall of the Third Reich',
    'A Peoples History of the United States',
    'Guns, Germs, and Steel',
    'The Autobiography of Malcolm X',
    'Long Walk to Freedom',
    'I Am Malala',
    'Educated',
    'The Diary of a Young Girl',
    'Night',
    'Mans Search for Meaning',
    'Into the Wild',
    'The Right Stuff',
    'Unbroken',
    'The Immortal Life of Henrietta Lacks',
    'Hidden Figures',
    'Steve Jobs',
    'Elon Musk',
    'Leonardo da Vinci',
    'Alexander Hamilton',
  ];

  const authors = [
    'Robert C. Martin', 'Erich Gamma', 'Thomas Cormen', 'Andrew Hunt',
    'Steve McConnell', 'Martin Fowler', 'Eric Freeman', 'Douglas Crockford',
    'Eric Matthes', 'Alex Banks', 'Callum Macrae', 'Mario Casciaro',
    'Abraham Silberschatz', 'Andrew Tanenbaum', 'Peter Galvin',
    'Stuart Russell', 'Ian Goodfellow', 'Andrew Ng', 'Joel Grus',
    'Donald Knuth', 'Jim Collins', 'Eric Ries', 'Peter Thiel',
    'Clayton Christensen', 'James Collins', 'Ben Horowitz',
    'Michael Gerber', 'Simon Sinek', 'Daniel Kahneman', 'Robert Cialdini',
    'Stephen Covey', 'Dale Carnegie', 'Robert Greene', 'Robert Kiyosaki',
    'Benjamin Graham', 'Robert Hagstrom', 'Lawrence Cunningham',
    'Burton Malkiel', 'Nassim Taleb', 'Stephen Hawking', 'Richard Dawkins',
    'Carl Sagan', 'Charles Darwin', 'Yuval Noah Harari',
    'Thomas Kuhn', 'Douglas Hofstadter', 'Simon Singh', 'Robert Kanigel',
    'Richard Feynman', 'James Watson', 'Siddhartha Mukherjee',
    'Rebecca Skloot', 'Peter Wohlleben', 'Merlin Sheldrake',
    'Peter Godfrey-Smith', 'Bill Bryson', 'Harper Lee', 'George Orwell',
    'Jane Austen', 'F. Scott Fitzgerald', 'Gabriel García Márquez',
    'J.D. Salinger', 'William Golding', 'John Steinbeck', 'Aldous Huxley',
    'Ray Bradbury', 'Margaret Atwood', 'Kurt Vonnegut', 'Joseph Heller',
    'Sylvia Plath', 'Toni Morrison', 'Chinua Achebe', 'Zora Neale Hurston',
    'Alice Walker', 'Khaled Hosseini', 'Doris Kearns Goodwin',
    'William Shirer', 'Howard Zinn', 'Jared Diamond', 'Malcolm X',
    'Nelson Mandela', 'Malala Yousafzai', 'Tara Westover', 'Anne Frank',
    'Elie Wiesel', 'Viktor Frankl', 'Jon Krakauer', 'Tom Wolfe',
    'Laura Hillenbrand', 'Margot Lee Shetterly', 'Walter Isaacson'
  ];

  const publishers = [
    'Pearson', 'OReilly Media', 'Addison-Wesley', 'MIT Press',
    'McGraw-Hill', 'Wiley', 'Springer', 'Cambridge University Press',
    'Oxford University Press', 'Penguin Random House', 'HarperCollins',
    'Simon & Schuster', 'Macmillan', 'Hachette', 'Scholastic',
    'Vintage', 'Anchor Books', 'Knopf', 'Crown', 'Bantam'
  ];

  const itemTypes = ['book', 'ebook', 'audio'];
  const formats = ['physical', 'digital', 'both'];
  const languages = ['en', 'es', 'fr', 'de', 'pt'];

  // Generate bulk items
  const bulkItems = [];
  
  for (let i = 0; i < bookTitles.length; i++) {
    const itemType = itemTypes[i % 3]; // Rotate between book, ebook, audio
    const format = itemType === 'book' ? 
      (i % 3 === 0 ? 'both' : 'physical') : 
      'digital';

    const item = {
      id: knex.raw('gen_random_uuid()'),
      title: bookTitles[i],
      author: authors[i % authors.length],
      publisher: publishers[i % publishers.length],
      publication_date: new Date(2000 + randomInt(0, 24), randomInt(0, 11), randomInt(1, 28)),
      description: `A comprehensive guide to ${bookTitles[i].split(':')[0]}. This ${itemType} provides in-depth coverage of the subject matter with practical examples and real-world applications. Perfect for students, professionals, and enthusiasts alike.`,
      category_id: getRandomCategory(),
      item_type: itemType,
      format: format,
      language: languages[i % languages.length],
      total_copies: format === 'physical' || format === 'both' ? randomInt(1, 5) : 1,
      available_copies: format === 'physical' || format === 'both' ? randomInt(1, 5) : 1,
      isbn: `978-${randomInt(1, 9)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}-${randomInt(0, 9)}`,
      status: 'available',
      pages: itemType !== 'audio' ? randomInt(100, 800) : null,
      edition: randomInt(1, 5) === 1 ? '1st' : randomInt(1, 5) === 2 ? '2nd' : '3rd',
      price: randomInt(1000, 5000) * 100, // In cents
      is_featured: i % 10 === 0, // Every 10th item is featured
      location: format === 'physical' || format === 'both' ? 
        `Shelf ${String.fromCharCode(65 + randomInt(0, 25))}-${randomInt(1, 20)}` : 
        null,
      added_by: adminId,
      // Digital items will have file_url and thumbnail_url (simulated)
      file_url: format === 'digital' || format === 'both' ? 
        `/uploads/library/files/${itemType}-${i}.${itemType === 'audio' ? 'mp3' : 'pdf'}` : 
        null,
      file_mime_type: format === 'digital' || format === 'both' ? 
        (itemType === 'audio' ? 'audio/mpeg' : 'application/pdf') : 
        null,
      file_size: format === 'digital' || format === 'both' ? 
        randomInt(1000000, 50000000) : 
        null,
      thumbnail_url: format === 'digital' || format === 'both' ? 
        `/uploads/library/thumbnails/thumb-${i}.jpg` : 
        null,
      cover_image_url: `/uploads/library/covers/cover-${i}.jpg`,
      duration: itemType === 'audio' ? randomInt(1800, 36000) : null, // 30min to 10hours in seconds
      tags: JSON.stringify([
        bookTitles[i].split(' ')[0].toLowerCase(),
        authors[i % authors.length].split(' ')[0].toLowerCase(),
        itemType
      ]),
      created_at: new Date(),
      updated_at: new Date()
    };

    bulkItems.push(item);
  }

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < bulkItems.length; i += batchSize) {
    const batch = bulkItems.slice(i, i + batchSize);
    await knex('library_items').insert(batch);
    console.log(`✓ Inserted library items batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(bulkItems.length / batchSize)}`);
  }

  console.log(`✓ Created ${bulkItems.length} library items`);
};
