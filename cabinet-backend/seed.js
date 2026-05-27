require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI, { tls: true, tlsAllowInvalidCertificates: true });

const recipes = [
  { name: "Scrambled Eggs", prepTime: 10, servings: 1, instructions: "Whisk eggs with milk and salt. Melt butter in a pan over medium heat. Add egg mixture and stir gently until cooked through.", ingredients: { eggs: 3, milk: 30, butter: 10, salt: 2 } },
  { name: "Pasta with Olive Oil and Garlic", prepTime: 20, servings: 2, instructions: "Boil pasta until al dente. In a pan, heat olive oil and sauté garlic until golden. Toss pasta in the oil and garlic. Season with salt and pepper.", ingredients: { pasta: 200, "olive oil": 30, garlic: 10, salt: 3, pepper: 2 } },
  { name: "Fried Rice", prepTime: 15, servings: 2, instructions: "Heat oil in a pan. Add garlic and onion, cook until soft. Add rice and stir fry. Add soy sauce and mix well.", ingredients: { rice: 300, garlic: 10, onion: 80, "soy sauce": 20, "olive oil": 15 } },
  { name: "Mashed Potatoes", prepTime: 25, servings: 2, instructions: "Boil potatoes until tender. Drain and mash with butter and milk. Season with salt and pepper.", ingredients: { potatoes: 400, butter: 30, milk: 60, salt: 3, pepper: 2 } },
  { name: "French Toast", prepTime: 15, servings: 2, instructions: "Whisk eggs with milk and sugar. Dip bread slices in the mixture. Fry in butter until golden on both sides.", ingredients: { eggs: 2, milk: 60, sugar: 15, bread: 100, butter: 20 } },
  { name: "Garlic Butter Chicken", prepTime: 30, servings: 2, instructions: "Season chicken with salt, pepper, and paprika. Sear in olive oil until golden. Add butter and garlic and baste the chicken. Cook through.", ingredients: { "chicken breast": 400, butter: 20, garlic: 15, "olive oil": 15, salt: 3, pepper: 2, paprika: 5 } },
  { name: "Tomato Rice", prepTime: 25, servings: 2, instructions: "Sauté onion and garlic in olive oil. Add tomatoes and cook down. Add rice and water, cook until rice is done. Season with salt and cumin.", ingredients: { rice: 250, tomatoes: 150, onion: 80, garlic: 10, "olive oil": 15, salt: 3, cumin: 3 } },
  { name: "Cheesy Scrambled Eggs", prepTime: 10, servings: 1, instructions: "Whisk eggs with milk and salt. Cook in butter over medium heat stirring gently. Add cheese just before done and fold in.", ingredients: { eggs: 3, milk: 30, butter: 10, cheese: 40, salt: 2 } },
  { name: "Potato and Egg Fry", prepTime: 20, servings: 2, instructions: "Dice potatoes and fry in olive oil until crispy. Push to the side and scramble eggs in the same pan. Mix together and season.", ingredients: { potatoes: 300, eggs: 3, "olive oil": 20, salt: 3, pepper: 2 } },
  { name: "Chicken and Rice", prepTime: 35, servings: 2, instructions: "Season chicken with salt, pepper, cumin and paprika. Brown in olive oil. Add rice and water and cook together until rice absorbs the liquid.", ingredients: { "chicken breast": 350, rice: 250, "olive oil": 15, salt: 3, pepper: 2, cumin: 3, paprika: 5 } },
  { name: "Pasta with Butter and Cheese", prepTime: 15, servings: 2, instructions: "Boil pasta until al dente. Drain and toss with butter until melted. Add cheese and mix well. Season with salt and pepper.", ingredients: { pasta: 200, butter: 30, cheese: 60, salt: 3, pepper: 2 } },
  { name: "Garlic Fried Potatoes", prepTime: 20, servings: 2, instructions: "Slice potatoes thin. Fry in olive oil until golden and crispy. Add garlic in the last minute. Season with salt, pepper and paprika.", ingredients: { potatoes: 400, garlic: 10, "olive oil": 25, salt: 3, pepper: 2, paprika: 4 } },
  { name: "Onion Omelette", prepTime: 15, servings: 1, instructions: "Dice onion and sauté in butter until soft. Whisk eggs with salt and pepper. Pour over onions and cook until set. Fold and serve.", ingredients: { eggs: 3, onion: 60, butter: 15, salt: 2, pepper: 2 } },
  { name: "Soy Glazed Chicken", prepTime: 25, servings: 2, instructions: "Mix soy sauce, garlic and a little sugar. Marinate chicken for 10 minutes. Pan fry in olive oil until cooked through and caramelized.", ingredients: { "chicken breast": 400, "soy sauce": 40, garlic: 10, sugar: 10, "olive oil": 15 } },
  { name: "Bread and Egg Toast", prepTime: 10, servings: 1, instructions: "Fry an egg in butter sunny side up. Toast bread. Place egg on toast and season with salt and pepper.", ingredients: { eggs: 1, bread: 60, butter: 10, salt: 2, pepper: 2 } },
  { name: "Spiced Rice", prepTime: 20, servings: 2, instructions: "Sauté onion and garlic in olive oil. Add cumin and paprika and stir. Add rice and water, cook until done. Season with salt.", ingredients: { rice: 250, onion: 80, garlic: 10, "olive oil": 15, cumin: 4, paprika: 4, salt: 3 } },
  { name: "Tomato and Egg Scramble", prepTime: 15, servings: 2, instructions: "Sauté diced tomatoes in olive oil with garlic until soft. Whisk eggs and pour in. Scramble together and season with salt and pepper.", ingredients: { eggs: 4, tomatoes: 150, garlic: 10, "olive oil": 15, salt: 3, pepper: 2 } },
  { name: "Cheesy Garlic Bread", prepTime: 10, servings: 2, instructions: "Mix butter with garlic. Spread on bread slices. Top with cheese. Bake at 375F for 8 minutes until cheese is melted and golden.", ingredients: { bread: 120, butter: 30, garlic: 8, cheese: 60 } },
  { name: "Chicken Stir Fry", prepTime: 25, servings: 2, instructions: "Slice chicken and marinate in soy sauce. Stir fry in olive oil with garlic and onion until cooked. Season with pepper.", ingredients: { "chicken breast": 350, "soy sauce": 30, garlic: 10, onion: 80, "olive oil": 15, pepper: 2 } },
  { name: "Paprika Potato Wedges", prepTime: 30, servings: 2, instructions: "Cut potatoes into wedges. Toss with olive oil, paprika, salt and pepper. Bake at 400F for 25 minutes until crispy.", ingredients: { potatoes: 500, "olive oil": 25, paprika: 6, salt: 4, pepper: 3 } },
];

async function seed() {
  await client.connect();
  const db = client.db('cabinet');
  await db.collection('recipes').deleteMany({});
  await db.collection('recipes').insertMany(recipes);
  console.log('Seeded', recipes.length, 'recipes');
  await client.close();
}

seed().catch(console.error);