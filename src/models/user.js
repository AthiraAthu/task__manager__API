const mongoose=require('mongoose')
const validator=require('validator')
const bcryptjs=require('bcryptjs')
const jwt=require('jsonwebtoken')
const Task=require('./task')

//mongoose does the convertion of the object that we have passed as 2nd arg in the model to schema.it is taking place in background
//So to take the advantage of middleware we have to make schema separately and pass it to that model
//so create schema

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,//built-in validator
        trim:true,

    },
    age:{
        type:Number,
        default:0,
        validate(value){//customized validator
            if(value < 0){
                throw new Error("Age must be a positive number")
            }
        }
    },
    email:{
        type:String,
        required:true,
        unique:true,//to avoid duplication
        lowercase:true,//convert to lowercase
        trim:true,//to trim out spaces before or after
        validate(value){
            if(!validator.isEmail(value)){//using validator pkg from npm
                throw new Error("Email is not valid")
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minlength:7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Passord cannot contain "password')
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true           //array of tokens for storing tokens
        }
    }],
    avatar:{
        type:Buffer     //store the buffer with binary image data
    }

    
},{
    timestamps:true
})
userSchema.virtual('tasks',{
    ref:'Task',
    'localField':'_id',
    'foreignField':'owner'   //creating virtual

})
userSchema.methods.toJSON = function (){   //when we call res.send() the user obj will be automatically converted into json behind the scenes and her we define toJSON () so it will be called automatically and manipulate obj
    const user=this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}
userSchema.methods.generateAuthToken = async function(){
    const user=this
    const token=jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET)
    user.tokens=user.tokens.concat({token})//concatenating the token into the array
    await user.save()//saving to the db
    return token
}
//when login happens this function will be called from user login route
userSchema.statics.findCredentials=async (email,password)=>{
    const user=await User.findOne({email})
    if(!user){
        throw new Error('Unable to login')
    }
    const isMatch=await bcryptjs.compare(password,user.password)
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user

}

//creating middleware for document being saved

//certain mongoose queies will bypass middleware.so if we try to use update() the middleware is not going to work.so we can make some changes in update route

userSchema.pre('save',async function (next){                                          //we can use pre(before occuring event) or post(after occuring event)
     const user=this     //this indicates this document                         //arg 1 ...event ..ie;save  here.. we have to do this func before saving model
    // console.log('just before saving')
    if(user.isModified('password')){
        user.password=await bcryptjs.hash(user.password,8)  //arg2 std func can not use arrow func cz that cant bind this keyword
        //next() should be called inorder to let it know that asynchronous calls have finished.if it is not called this entire func will run infinitely

        // console.log(user.password)
    }

    next()
})                                 

userSchema.pre('remove',async function(next){//delete allthe tasks associated with the user when deleting that user
    const user=this
    await Task.deleteMany({owner:user._id})
    next()
})


const User=mongoose.model('User',userSchema)




//older code without schema


// const User=mongoose.model('User',{
//     name:{
//         type:String,
//         required:true,//built-in validator
//         trim:true,

//     },
//     age:{
//         type:Number,
//         default:0,
//         validate(value){//customized validator
//             if(value < 0){
//                 throw new Error("Age must be a positive number")
//             }
//         }
//     },
//     email:{
//         type:String,
//         required:true,
//         lowercase:true,//convert to lowercase
//         trim:true,//to trim out spaces before or after
//         validate(value){
//             if(!validator.isEmail(value)){//using validator pkg from npm
//                 throw new Error("Email is not valid")
//             }
//         }
//     },
//     password:{
//         type:String,
//         required:true,
//         trim:true,
//         minlength:7,
//         validate(value){
//             if(value.toLowerCase().includes('password')){
//                 throw new Error('Passord cannot contain "password')
//             }
//         }
//     }
// })


module.exports=User