// knexfile.js
module.exports = {
    development: {
      client: 'pg',
      connection: {
        host: 'localhost',
        port: '5434',
        user: 'postgres',
        password: 'root',
        database: 'triada'
      },
      migrations: {
        directory: './migrations'
      }
    }
  };
  