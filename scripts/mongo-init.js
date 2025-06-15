// MongoDB initialization script for Docker
print('Starting MongoDB initialization for User Service');

// Switch to user_service database
db = db.getSiblingDB('user_service');

// Create application user
db.createUser({
  user: 'userservice',
  pwd: 'userservice123',
  roles: [
    {
      role: 'readWrite',
      db: 'user_service'
    }
  ]
});

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });
db.users.createIndex({ "emailVerified": 1 });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "lastLoginAt": -1 });
db.users.createIndex({ 
  "username": "text", 
  "profile.firstName": "text", 
  "profile.lastName": "text",
  "profile.displayName": "text"
});

print('MongoDB initialization completed');
