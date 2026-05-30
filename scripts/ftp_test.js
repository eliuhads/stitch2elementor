require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ftp = require('basic-ftp');
(async () => {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    });
    console.log('✅ FTP connection successful');
  } catch (err) {
    console.error('❌ FTP connection failed:', err.message);
  } finally {
    client.close();
  }
})();
