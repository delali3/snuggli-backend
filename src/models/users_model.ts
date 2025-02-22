interface User {
  id?: number;
  firstname?: string;
  lastname?: string;
  username?: string;
  phone: string;
  email: string;
  password: string;
  parent_id?: number;
  user_type_id: number;
  profile_picture?: string;
  profile_status: number;
  timestamp: number;
  usertype?: string;  // this isnt in the database
}

export default User;
