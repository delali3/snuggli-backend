create table appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references users(id) not null,
  doctor_id uuid references doctor_profiles(id) not null,
  date_time timestamp with time zone not null,
  status varchar(20) check (status in ('upcoming', 'completed', 'cancelled')) default 'upcoming',
  notes text,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

create index idx_appointments_patient on appointments(patient_id);
create index idx_appointments_doctor on appointments(doctor_id);
create index idx_appointments_datetime on appointments(date_time);