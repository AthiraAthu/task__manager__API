const express = require('express')
const multer=require('multer')
const sharp=require('sharp')
const route=new express.Router()
const User=require('../models/user')
const auth=require('../middleware/auth')

//for creating user
route.post('/users',async (req,res)=>{
    
    const user=new User(req.body)
    try{
        const token=await user.generateAuthToken()//token gen foe signup
        await user.save()
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)
    }
    
})


//for login
route.post('/users/login',async (req,res)=>{
    try{
        const user=await User.findCredentials(req.body.email,req.body.password)
        const token=await user.generateAuthToken()
        res.send({user,token})

    }catch(e){
        res.status(400).send()
    }
})

//logout
route.post('/users/logout',auth,async (req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token) =>{
            return token.token!==req.token
        })
        await req.user.save()
        res.send()


    }catch(e){
        res.status(401).send(e)
    }
})

//logout all

route.post('/users/logoutall',auth,async (req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send()


    }catch(e){
        res.status(500).send(e)
    }
})

//getting user profile
route.get('/users/me',auth,async (req,res)=>{
   res.send(req.user)               
})

//updating user
route.patch('/users/me',auth,async (req,res) =>{
    const updates=Object.keys(req.body)
    const allowedUpdates=['name','age','email','password']
    const isValidUpdate=updates.every((update) =>{
        return allowedUpdates.includes(update)
    })
    if(!isValidUpdate){
        return res.status(400).send({error:'Invalid updates!!'})
    }
    try{
       
        updates.forEach((update) =>req.user[update]=req.body[update])
        await req.user.save()
        res.send(req.user)
    }catch(e){    
        res.status(500).send(e)
    }
})

//deleting user
route.delete('/users/me',auth,async (req,res) =>{
    try{
        await req.user.remove()     
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

const upload=multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req, file, cb){
            if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ 
            return cb(new Error('upload a jpg/jpeg/png image'))      
        }
        cb(undefined,true)
    }
})
//uploading file
route.post('/users/me/avatar',auth,upload.single('avatar'), async (req,res) =>{
    const buffer=await sharp(req.file.buffer).resize({height:250,width:250}).png().toBuffer()
    req.user.avatar=buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error:error.message}) 
})                     

//deleting profile picture
route.delete('/users/me/avatar',auth, async (req,res) =>{
    req.user.avatar=undefined
    await req.user.save()       
    res.send()
})

//getting user profile picture
route.get('/users/:id/avatar',async (req,res)=>{
    try{
        const user=await User.findById(req.params.id)
        if(!user|!user.avatar){
            throw new Error()                           
        }
        res.set('content-type','image/png')
        res.send(user.avatar)

    }catch(e){
        res.status(404).send()
    }
})


module.exports=route
