 const mongoose=require('mongoose')

 //creating separate schema

const taskSchema=new mongoose.Schema({
    description:{
        type:String,
        trim:true,
        required:true
 
    },
    completed:{
        type:Boolean,
        default:false
    },
    owner:{
        //data stored is here is objid
        type:mongoose.Schema.ObjectId, ///craeting owner for the task
        required:true,
        ref:'User'  //making relation btwn User and task
    }
 },{
     timestamps:true
 })


const Task=mongoose.model('Task',taskSchema)

 module.exports=Task