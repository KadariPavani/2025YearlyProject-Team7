#!/usr/bin/env python3
"""
MongoDB Data Migration Script
Migrates data from 'test' database to 'khub_production' database
"""

import pymongo
from pymongo import MongoClient
import json
from datetime import datetime

# MongoDB Connection Configuration
SOURCE_DB = "test"  # Your original database
TARGET_DB = "khub_production"  # New database name

# MongoDB Atlas connection string (replace with your actual credentials)
MONGO_URI = "mongodb+srv://praveen:12345@cluster0.i4zpcov.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Collections to migrate (add/remove as needed)
COLLECTIONS_TO_MIGRATE = [
    "users",
    "contests", 
    "courses",
    "enrollments",
    "notifications",
    "quizzes",
    "quizattempts",
    "submissions",
    "tasks"
]

def connect_to_mongodb():
    """Connect to MongoDB and return client"""
    try:
        client = MongoClient(MONGO_URI)
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully")
        return client
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return None

def migrate_collection(client, collection_name):
    """Migrate a single collection from source to target database"""
    try:
        source_db = client[SOURCE_DB]
        target_db = client[TARGET_DB]
        
        source_collection = source_db[collection_name]
        target_collection = target_db[collection_name]
        
        # Get document count in source
        source_count = source_collection.count_documents({})
        
        if source_count == 0:
            print(f"⚠️  {collection_name}: No documents found, skipping")
            return True
        
        print(f"📄 Migrating {collection_name}: {source_count} documents")
        
        # Check if target collection already has data
        target_count = target_collection.count_documents({})
        if target_count > 0:
            response = input(f"⚠️  Target collection '{collection_name}' already has {target_count} documents. Overwrite? (y/N): ")
            if response.lower() != 'y':
                print(f"⏭️  Skipping {collection_name}")
                return True
            
            # Clear target collection
            target_collection.delete_many({})
            print(f"🗑️  Cleared existing data in {collection_name}")
        
        # Migrate documents in batches
        batch_size = 1000
        migrated_count = 0
        
        cursor = source_collection.find({})
        
        while True:
            batch = list(cursor.limit(batch_size).skip(migrated_count))
            if not batch:
                break
            
            # Insert batch to target
            target_collection.insert_many(batch)
            migrated_count += len(batch)
            
            print(f"   📦 Migrated {migrated_count}/{source_count} documents")
        
        # Verify migration
        final_count = target_collection.count_documents({})
        if final_count == source_count:
            print(f"✅ {collection_name}: Successfully migrated {final_count} documents")
            return True
        else:
            print(f"❌ {collection_name}: Migration error - Expected {source_count}, got {final_count}")
            return False
            
    except Exception as e:
        print(f"❌ Error migrating {collection_name}: {e}")
        return False

def copy_indexes(client, collection_name):
    """Copy indexes from source to target collection"""
    try:
        source_db = client[SOURCE_DB]
        target_db = client[TARGET_DB]
        
        source_collection = source_db[collection_name]
        target_collection = target_db[collection_name]
        
        # Get indexes from source
        indexes = list(source_collection.list_indexes())
        
        for index in indexes:
            if index['name'] == '_id_':  # Skip default _id index
                continue
            
            # Create index on target
            index_keys = index['key']
            index_options = {k: v for k, v in index.items() if k not in ['key', 'v', 'ns']}
            
            target_collection.create_index(list(index_keys.items()), **index_options)
            print(f"   📋 Copied index: {index['name']}")
            
    except Exception as e:
        print(f"⚠️  Warning: Could not copy indexes for {collection_name}: {e}")

def generate_migration_report(client):
    """Generate a report comparing source and target databases"""
    print("\n" + "="*60)
    print("📊 MIGRATION REPORT")
    print("="*60)
    
    source_db = client[SOURCE_DB]
    target_db = client[TARGET_DB]
    
    print(f"{'Collection':<20} {'Source':<10} {'Target':<10} {'Status'}")
    print("-" * 50)
    
    total_source = 0
    total_target = 0
    
    for collection_name in COLLECTIONS_TO_MIGRATE:
        try:
            source_count = source_db[collection_name].count_documents({})
            target_count = target_db[collection_name].count_documents({})
            
            status = "✅ OK" if source_count == target_count else "❌ MISMATCH"
            
            print(f"{collection_name:<20} {source_count:<10} {target_count:<10} {status}")
            
            total_source += source_count
            total_target += target_count
            
        except Exception as e:
            print(f"{collection_name:<20} {'ERROR':<10} {'ERROR':<10} ❌ {str(e)[:20]}")
    
    print("-" * 50)
    print(f"{'TOTAL':<20} {total_source:<10} {total_target:<10}")
    print(f"\nMigration {'✅ SUCCESSFUL' if total_source == total_target else '❌ INCOMPLETE'}")

def main():
    print("🚀 MongoDB Data Migration Tool")
    print(f"📥 Source Database: {SOURCE_DB}")
    print(f"📤 Target Database: {TARGET_DB}")
    print(f"🔗 MongoDB URI: {MONGO_URI[:50]}...")
    print()
    
    # Connect to MongoDB
    client = connect_to_mongodb()
    if not client:
        return
    
    # List available databases
    db_list = client.list_database_names()
    print(f"📚 Available databases: {', '.join(db_list)}")
    
    if SOURCE_DB not in db_list:
        print(f"❌ Source database '{SOURCE_DB}' not found!")
        return
    
    # Confirm migration
    print(f"\n⚠️  This will migrate data from '{SOURCE_DB}' to '{TARGET_DB}'")
    confirm = input("Continue? (y/N): ")
    if confirm.lower() != 'y':
        print("❌ Migration cancelled")
        return
    
    print(f"\n🏁 Starting migration at {datetime.now()}")
    
    # Migrate each collection
    successful_migrations = 0
    
    for collection_name in COLLECTIONS_TO_MIGRATE:
        print(f"\n📂 Processing {collection_name}...")
        
        if migrate_collection(client, collection_name):
            copy_indexes(client, collection_name)
            successful_migrations += 1
        else:
            print(f"❌ Failed to migrate {collection_name}")
    
    # Generate report
    generate_migration_report(client)
    
    print(f"\n🎉 Migration completed!")
    print(f"✅ Successfully migrated: {successful_migrations}/{len(COLLECTIONS_TO_MIGRATE)} collections")
    
    # Close connection
    client.close()
    print("🔐 Database connection closed")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  Migration cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")