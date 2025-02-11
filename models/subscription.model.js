import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Subscription name is required'],
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    price:{
        type: Number,
        required: [true, 'Subscription price is required'],
        min: [0, 'Price must be greater than 0'],
    },
    currency:{
        type: String,
        required: [true, 'Subscription currency is required'],
        enum: ['USD','BRL','EUR'],
        default: 'BRL'
    },
    frequency:{
        type: String,
        required: [true, 'Subscription frequency is required'],
        enum: ['daily','weekly','monthly','yearly'],
        default: 'monthly'
    },
    category:{
        type: String,
        required: [true, 'Subscription category is required'],
        enum: ['sports', 'news', 'entertainment', 'lifestyle', 'technology', 'business', 'finance', 'politics', 'other'],
        default: 'basic'
    },
    paymentMethod:{
        type: String,
        required: [true, 'Subscription payment method is required'],
        trim: true,
    },
    status:{
        type: String,
        required: [true, 'Subscription status is required'],
        enum: ['active','canceled','expired'],
        default: 'active'
    },
    startDate: {
        type: Date,
        required: [true, 'Subscription start date is required'],
        validate:{
            validator: (value) => value <= new Date(),
            message: 'Start date must be in the past'
        },

    },
    renewalDate: {
        type: Date,
        required: [true, 'Subscription renewal date is required'],
        validate:{
            validator: function (value) {
               return  value > this.startDate
            },
            message: 'Renewal date must be after the start date'
        },
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true, //optimize the queries by indexing the user fields
    }
}, {timestamps: true});

//Auto-calculate the renewal date  if missing.
subscriptionSchema.pre('save', function(next){
    if(!this.renewalDate){
        const renewalPeriods ={
            daily: 1,
            weekly: 7,
            monthly: 30,
            yearly: 365,
        };
        this.renewalDate = new Date(this.startDate);
        this.renewalDate.setDate(this.renewalDate.getDate() + renewalPeriods[this.frequency]);
    }
    //Auto-update the status if renewal date has passed
    if(this.renewalDate< new Date()){
        this.status = 'expired';
    }
    next();
})

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
