const mongoose = require('mongoose')

let questionSchema = mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.String,
    required: true
  },
  question: {
    type: mongoose.Schema.Types.String,
    required: true
  },
  answers: [{
    type: mongoose.Schema.Types.String
  }],
  correctAnswers: [{
    type: mongoose.Schema.Types.String
  }]
})

let Question = mongoose.model('Question', questionSchema)

module.exports = Question