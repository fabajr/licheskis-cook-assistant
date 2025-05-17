# Licheskis Cook Assistant - Firebase Firestore Database Schema

## Overview

This document outlines the database schema for the Licheskis Cook Assistant application using Firebase Firestore. The schema is designed to support meal planning based on hormonal cycles, recipe filtering, and grocery list generation.

## Collections Structure

### 1. `ingredients` Collection

Stores information about individual ingredients.

```
ingredients/{ingredientId}
```

**Document Schema:**
```json
{
  "id": "string",
  "name": "string",
  "aliases": ["string"],
  "category": "string",
  "default_unit": "string",
  "kcal_per_unit": "number",
  "is_vegan": "boolean",
  "is_gluten_free": "boolean",
  "alternative_units": [
    {
      "unit": "string",
      "conversion_factor": "number"
    }
  ],
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 2. `recipes` Collection

Stores recipe metadata.

```
recipes/{recipeId}
```

**Document Schema:**
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "cycle_tags": ["string"],
  "servings": "number",
  "prep_time": "number",
  "instructions": [
    {
      "step": "number",
      "text": "string"
    }
  ],
  "image_url": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 3. `recipe_ingredients` Collection

Stores the relationship between recipes and ingredients.

```
recipe_ingredients/{recipeIngredientId}
```

**Document Schema:**
```json
{
  "id": "string",
  "recipe_id": "string",
  "ingredient_id": "string",
  "quantity": "number",
  "unit": "string"
}
```

### 4. `users` Collection

Stores user profiles and preferences, including hormonal cycle parameters.

```
users/{userId}
```

**Document Schema:**
```json
{
  "id": "string",
  "email": "string",
  "display_name": "string",
  "preferences": {
    "dietary_restrictions": ["string"],
    "calorie_target": "number"
  },
  "hormonal_cycle": {     
    "start_date": "timestamp",
    "cycle_length": "number",
    "menstrual_length": "number",
    "ovulatory_length": "number",
    "follicular_length": "number",
    "midluteal_length": "number",
    "lateluteal_length": "number",
    "updated_at": "timestamp"
    },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 6. `meal_plans` Collection

User-created meal plans under each user document.

```
users/{userId}/meal_plans/{mealPlanId}
```

**Document Schema:**
```json
{
  "id": "string",
  "user_id": "string",
  "name": "string",
  "start_date": "timestamp",
  "end_date": "timestamp",
    "days": [
    {
      "date": "timestamp",
      "meals": [
        {
          "type": "string",
          "recipe_id": "string"
        }
      ]
    }
  ],
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 7. `grocery_lists` Collection

Stores generated grocery lists.

```
users/{userId}/grocery_lists/{groceryListId}
```

**Document Schema:**
```json
{
  "id": "string",
  "user_id": "string",
  "meal_plan_id": "string",
  "items": [
    {
      "ingredient_id": "string",
      "name": "string",
      "category": "string",
      "quantity": "number",
      "unit": "string"
    }
  ],
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Indexes

To support efficient queries, the following indexes should be created:

### Single-Field Indexes

1. `recipes.category`
2. `recipes.cycle_tags`
3. `ingredients.category`
4. `ingredients.is_vegan`
5. `ingredients.is_gluten_free`
6. `meal_plans.start_date`
7. `meal_plans.end_date`
8. `grocery_lists.meal_plan_id`
9. `recipes.is_vegan`
10. `recipes.is_gluten_free`

### Composite Indexes

1. `recipes.category, recipes.cycleTags`
2. `meal_plans.userId, meal_plans.startDate`
3. `grocery_lists.userId, grocery_lists.createdAt`

## Data Relationships

1. Each recipe has multiple ingredients (via recipe_ingredients)
2. Each ingredient can be used in multiple recipes (via recipe_ingredients)
4. Each user can have multiple meal plans
6. Each grocery list is associated with a specific meal plan

## Query Patterns

### Recipe Filtering

1. Filter recipes by meal category 'Breakfast','Soups&Salads','Entree'(Lunch/Dinner),'Snacks','Desserts'
2. Filter recipes by hormonal phase (M, F, O, ML, LL)
3. Filter recipes by dietary restrictions (vegan, gluten-free) ( Calculate by each ingredient in recipe)
4. Filter recipes by caloric value
5. Combination of the above filters

### Meal Planning

1. Fetch meal plan for a date range.
2. Fetch meal plan for current hormonal phase.

### Grocery List Generation

1. Generate grocery list from selected meal plan
2. Group grocery items by category
3. Calculate total quantities for each ingredient

## Data Validation Rules

1. Recipe names must be unique
2. Ingredient names must be unique
3. Cycle tags must be one of: "M", "F", "O", "ML", "LL"
4. Meal types must be one of: 'Breakfast','Soups&Salads','Lunch','Snacks','Diner','Desserts'
5. Units must be valid (from a predefined list)
6. Quantities must be positive numbers
7. Dates must be valid timestamps

## Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 1. USERS: cada usuário só pode ler/escrever seu próprio perfil
    match /users/{userId} {
      allow create:        if request.auth != null && request.auth.uid == userId;
      allow read, update, delete:
        if request.auth != null && request.auth.uid == userId;
    }

    // 2. RECIPES: públicas para leitura, mas só admins podem criar/editar/excluir
    match /recipes/{recipeId} {
      allow read:  if true;
      allow create, update, delete:
        if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 3. INGREDIENTS: mesmas regras de recipes
    match /ingredients/{ingredientId} {
      allow read:  if true;
      allow create, update, delete:
        if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 4. RECIPE_INGREDIENTS: mesmas regras de recipes
    match /recipe_ingredients/{linkId} {
      allow read:  if true;
      allow create, update, delete:
        if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 5. MEAL_PLANS como subcoleção de USERS:
    match /users/{userId}/meal_plans/{planId} {
      // ao criar, userId no path e no payload (camelCase) devem bater
      allow create:
        if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.userId == userId;
      // leitura/edição: só o dono
      allow read, update, delete:
        if request.auth != null
        && request.auth.uid == userId
        && resource.data.userId == userId;
    }

    // 6. GROCERY_LISTS como subcoleção de USERS:
    match /users/{userId}/grocery_lists/{listId} {
      allow create:
        if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.userId == userId;
      allow read, update, delete:
        if request.auth != null
        && request.auth.uid == userId
        && resource.data.userId == userId;
    }

    // 7. Outras coleções (logs, configurações etc.) ficam conforme necessidade
  }
}
```

## Future Extensibility

The schema is designed to support future features:

1. PDF exports of meal plans and grocery lists
2. AI-based recipe recommendations
3. Integration with wearable data
4. Nutrition goals and alerts

