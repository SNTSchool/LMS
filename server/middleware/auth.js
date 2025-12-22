export function requireAuth(req, res, next) {
  // 🔧 DEV / DEMO MODE
  // ถ้าอยากใช้ Firebase จริง ค่อยเพิ่มทีหลัง
  req.user = {
    uid: 'demo-user',
    email: 'demo@local'
  }
  req.userRole = 'admin'

  next()
}