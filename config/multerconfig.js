const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

//diskStorage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },                                                          //above object set file ka path
    filename: function (req, file, cb) {
        crypto.randomBytes(12, function (err, name){
           const fn = name.toString("hex")+path.extname(file.originalname);
        })                                                         //above object set file name
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
  const upload = multer({ storage: storage })

  module.exports = upload;