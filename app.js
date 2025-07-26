const express = require('express');
const app = express();
const mongoose =require('mongoose');
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const upload = require("./config/multerconfig");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());


app.get('/', (req, res) => {
    res.render('index');
})
app.get('/profile/upload', (req, res) => {
    res.render('profileupload');
});
app.post('/upload', isLoggedIn, upload.single("image"), async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect("/profile");
});
app.get('/login', (req, res) => {
    res.render('login');
})
app.get('/profile',isLoggedIn, async (req, res) => {
   let user = await userModel.findOne({email:req.user.email}).populate("posts");
    res.render('profile',{user});
})

app.get('/like/:id',isLoggedIn, async (req, res) => {
   let post = await postModel.findOne({_id: req.params.id}).populate("user");
   if(post.likes.indexOf(req.user.userid) === -1){
    post.likes.push(req.user.userid);
   }
   else{
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
   }
   await post.save();
   res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    res.render("edit", { post });
 });

app.post('/update/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, {content: req.body.content}).populate("user");
    res.redirect("/profile");
 });
 
app.post('/post',isLoggedIn, async (req, res) => {
   let user = await userModel.findOne({email:req.user.email});
   let{content} = req.body;   //destructuring

   let post = await postModel.create({
    user:user._id,
    content
   });
   user.posts.push(post._id);
   await user.save();
   res.redirect("/profile");
  
});


app.get('/logout', (req, res) => {
    res.cookie("token","");
    res.render('login');
    
})
function isLoggedIn(req, res, next){
    const token = req.cookies.token;

    if (!token) { // this checks for undefined, null, or empty string
        return res.redirect("/login");
    }

    try {
        const data = jwt.verify(token, "secretkey");
        req.user = data;
        next();
    } catch (err) {
        console.error("JWT error:", err.message);
        res.redirect("/login");
    }
}


app.post('/login', async (req, res) => {
    let { email, password} = req.body;  //de-Structuring
    let user = await userModel.findOne({ email }); 
    if (!user) return res.status(500).send("Something went wrong");

    bcrypt.compare(password, user.password, (err, result)=>{
       if(result) {
        let token = jwt.sign({email:email, userid: user._id},"secretkey");
        res.cookie("token",token);
        res.status(200).redirect("/profile");
       } 
       else res.redirect("/login");
    })

});
app.post('/register', async (req, res) => {
    try {
        let { email, password, username, name, age } = req.body;

        let user = await userModel.findOne({ email });
        if (user) return res.status(400).send("User Already Exist");

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) return res.status(500).send("Error hashing password");

                let newUser = await userModel.create({
                    email,
                    password: hash,
                    username,
                    name,
                    age
                });

                let token = jwt.sign({ email, userid: newUser._id }, "secretkey");
                res.cookie("token", token);
                res.redirect("/profile");
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
  });
  