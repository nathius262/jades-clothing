import db from '../../../models/index.cjs';
//import bcrypt from 'bcrypt';


export const findAll = async () => {
  try {
    return await db.User.findAll();
  } catch (error) {
    throw new Error('Error fetching records: ' + error.message);
  }
};

export const findById = async (id) => {
  try {
    const item = await db.User.findByPk(id);
    if (!item) throw new Error('Not found');
    return item;
  } catch (error) {
    throw new Error('Error fetching record: ' + error.message);
  }
};

export const create = async ({username, email, password, roleIds=[]}) => {
  try {

    const hashed_password = "osdjs93rjml23rno2nknn"  //await bcrypt.hash(password, 10);
    const user_role = await db.Role.findOne({where: {name: 'user'}});
    if (!user_role) throw new Error("default role 'user' not found");

    const new_user = await db.User.create({username, email, password:hashed_password});

    const user_assigned_roles =  roleIds.length > 0 ? [user_role.id, ...roleIds]: [user_role.id];
    await new_user.setRoles(user_assigned_roles);
    const created_user = await findById(new_user.id);
    
    return created_user;

  } catch (error) {
    throw new Error('Error creating record: ' + error.message);
  }
};

export const update = async (id, data) => {
  try {
    const item = await db.User.findByPk(id);
    if (!item) throw new Error('Not found');
    return await item.update(data);
  } catch (error) {
    throw new Error('Error updating record: ' + error.message);
  }
};

export const destroy = async (id) => {
  try {
    const item = await db.User.findByPk(id);
    if (!item) throw new Error('Not found');
    return await item.destroy();
  } catch (error) {
    throw new Error('Error deleting record: ' + error.message);
  }
};

export const adminMethod = async () => {
  return 'Admin-specific logic here';
};