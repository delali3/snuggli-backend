// db/init.ts
import { supabase } from "./db_config";

export async function initializeDatabase() {
  try {
    // Create user_types table and insert default types
    const { error: userTypesError } = await supabase.rpc('create_user_types_if_not_exists', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_types (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default user types if they don't exist
        INSERT INTO user_types (name)
        VALUES ('admin'), ('doctor'), ('patient')
        ON CONFLICT (name) DO NOTHING;
      `
    });

    // Create profile_statuses table and insert default statuses
    const { error: statusError } = await supabase.rpc('create_profile_statuses_if_not_exists', {
      sql: `
        CREATE TABLE IF NOT EXISTS profile_statuses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default statuses
        INSERT INTO profile_statuses (name)
        VALUES ('pending'), ('active'), ('inactive')
        ON CONFLICT (name) DO NOTHING;
      `
    });

    // Create users table if it doesn't exist
    const { error: usersError } = await supabase.rpc('create_users_if_not_exists', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(10) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          user_type_id UUID REFERENCES user_types(id),
          profile_status UUID REFERENCES profile_statuses(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      `
    });

    if (userTypesError || statusError || usersError) {
      throw new Error('Failed to initialize database tables');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}