// auth-service/src/db/migrations/create_consultation_sessions.sql
create table consultation_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references users(id) not null,
    start_time timestamp with time zone default current_timestamp,
    last_update_time timestamp with time zone default current_timestamp,
    status varchar(20) check (status in ('active', 'completed')) default 'active',
    summary text,
    primary_symptoms text[],
    created_at timestamp with time zone default current_timestamp,
    updated_at timestamp with time zone default current_timestamp
  );
  
  -- Add session_id to consultation_messages table
  alter table consultation_messages
  add column session_id uuid references consultation_sessions(id);