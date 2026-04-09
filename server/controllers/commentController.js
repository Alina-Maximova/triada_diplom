const db = require('../utils/db');

exports.getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log(req.params);
    
    const comments = await db('comments')
      .select(
        'comments.*',
        'users.username as user_name'
      )
      .leftJoin('users', 'comments.user_id', 'users.id')
      .where('comments.task_id', taskId)
      .orderBy('comments.created_at', 'desc');
    
    // Форматируем (можно оставить как есть)
    const formattedComments = comments.map(comment => ({
      ...comment,
      user_name: comment.full_name || comment.user_name
    }));
    
    res.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    console.log("12345678");
    const { task_id, content } = req.body;
    const user_id = req.user.id;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Содержание комментария обязательно' });
    }
    
    const [comment] = await db('comments')
      .insert({
        task_id,
        user_id,
        content: content.trim()
      })
      .returning('*');
    
    // Получаем имя пользователя для ответа
    const user = await db('users')
      .select('username')
      .where({ id: user_id })
      .first();
    
    const result = {
      ...comment,
      user_name: user ? user.username : null
    };
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // Проверяем, принадлежит ли комментарий пользователю
    const comment = await db('comments').where({ id, user_id }).first();
    
    if (!comment) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }
    
    await db('comments').where({ id }).del();
    
    res.json({ success: true, message: 'Комментарий удален' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};