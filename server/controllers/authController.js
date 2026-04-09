const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const SECRET_KEY = '30cb38c05fd1519a13daac5b47f58f62';



exports.login = async (req, res) => {
    const { username, password } = req.body;
console.log("alina")
    try {
        // Получаем пользователя с JOIN к таблице ролей
        const user = await db('users')
            .select(
                'users.*',
                'roles.name as role_name'
            )
            .leftJoin('roles', 'users.role_id', 'roles.id')
            .where({ 'users.username': username })
            .first();



        if (!user) {
            

            return res.status(401).json({
                success: false,
                error: 'Пользователь с таким именем не зарегистрирован'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            console.log(  {
                    id: user.id,
                    name: user.surname + " " + user.name + " " + user.patronymic,
                    username: user.username,
                    email: user.email,
                    role_id: user.role_id,
                    role_name: user.role_name || 'user'
                })
            // Создаем токен с полной информацией о пользователе
            const token = jwt.sign(
                {
                    id: user.id,
                    name: user.surname + " " + user.name + " " + user.patronymic,
                    username: user.username,
                    email: user.email,
                    role_id: user.role_id,
                    role_name: user.role_name || 'user'
                },
                SECRET_KEY
            );

            res.json({
                success: true,
                token,
            });
        } else {
            res.status(401).json({
                success: false, 
                error: 'Неверный пароль'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при входе'
        });
    }
};


exports.createUser = async (req, res) => {
    const { surname, name, patronymic, username, email, password, role_id } = req.body;

    try {
        // Проверяем, существует ли пользователь с таким email
        const emailUser = await db('users').where({ email }).first();
        if (emailUser) {
            return res.status(400).json({ error: 'Почта уже занята' });
        }
        const usernameUser = await db('users').where({ username }).first();
        if (usernameUser) {
            return res.status(400).json({ error: 'Никнейм занято' });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаём пользователя
        const [userId] = await db('users')
            .insert({
                surname,
                name,
                patronymic,
                username,
                email,
                password: hashedPassword,
                role_id
            })
            .returning('id');

        // Возвращаем успешный ответ
        res.status(201).json({
            success: true,
            message: 'Пользователь успешно создан',
            userId: userId.id || userId
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Ошибка создания пользователя' });
    }
};
exports.getUsers = async (req, res) => {

    try {
        const Users = await db('users').select('*');
        res.json(Users);
    } catch (error) {
        console.log(error.detail);
        res.status(500).send('Ошибка регистрации');
    }
};
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Сначала получаем задачу, чтобы проверить наличие отчета
        const task = await db('users').where({ id }).first();
        if (!task) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }



        // Удаляем пользователя
        await db('users').where({ id }).del();

        res.status(200).json({ success: true, message: 'Users deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
};

