const express = require('express')
const authCheck = require('../middleware/auth-check')
const Quiz = require('../models/Quiz')
const Question = require('../models/Question')
const SolvedQuiz = require('../models/SolvedQuiz')
const User = require('../models/User')
const helpers = require('./helpers')
const router = new express.Router()

function validateQuizData (data) {
  const errors = {}
  let isValid = true
  let message = ''

  console.log(data)
  if (!data || typeof data.title !== 'string' || data.title < 3) {
    isValid = false
    errors.title = 'Title must be more than 2 symbols.'
  }

  if (!isValid) {
    message = 'Check the form for errors.'
  }

  return {
    success: isValid,
    message,
    errors
  }
}

router.post('/create', authCheck, (req, res) => {
  const quizData = req.body
  const validationResult = validateQuizData(quizData)
  if (!validationResult.success) {
    return res.status(200).json({
      success: false,
      message: validationResult.message,
      errors: validationResult.errors
    })
  }

  const quizToAdd = {
    name: quizData.title.trim(),
    description: quizData.description.trim(),
    creatorId: quizData.userId
  }
  // console.log(quizToAdd)
  Quiz.create(quizToAdd).then(quiz => {
    res.status(200).json({
      success: true,
      message: `Quiz ${quiz.name} added!`,
      quiz
    })
  }).catch(err => {
    console.log('Error: ' + err)
    return res.status(500).json({
      success: false,
      message: 'Cannot write the quiz in database',
      errors: 'Quiz error'
    })
  })
})

router.post('/addQuestion', authCheck, (req, res) => {
  const questionData = req.body
  // TODO: validate!
  // const validationResult = validateQuestionData(questionData)
  // if (!validationResult.success) {
  //   return res.status(200).json({
  //     success: false,
  //     message: validationResult.message,
  //     errors: validationResult.errors
  //   })
  // }

  const questionToAdd = {
    quizId: questionData.quizId,
    question: questionData.questionName.trim(),
    answers: questionData.answers,
    correctAnswers: questionData.correctAnswers,
    number: questionData.questionNumber
  }
  // console.log(questionToAdd)
  Question.create(questionToAdd).then(question => {
    let quizId = question.quizId
    let questionId = question._id
    Quiz.findByIdAndUpdate(quizId, {$push: {questions: questionId}}, {upsert: true}, function (err, doc) {
      if (err) {
        return res.send(500, { error: err })
      }
    })

    res.status(200).json({
      success: true,
      message: `Question ${question.question} added!`,
      question
    })
  }).catch(err => {
    console.log('Error: ' + err)
    return res.status(500).json({
      success: false,
      message: 'Cannot write the qusetion in database',
      errors: 'Question error'
    })
  })
})

router.get('/getAllQuizzes', (req, res) => {
  Quiz
    .find()
    .then(quizzes => {
      // console.log(quizzes)
      res.status(200).json({
        success: true,
        message: `Quizzes loaded!`,
        quizzes
      })
    }).catch(err => {
      console.log(err)
      res.status(400).json({
        success: false,
        message: 'No Quizzes. Care to add some?',
        error: 'Quiz error'
      })
    })
})

router.get('/getQuestions/:id', (req, res) => {
  const id = req.params.id
  console.log(id)
  Question.find({quizId: id}).then(questions => {
    if (!questions) {
      res.status(400).json({ message: 'No Questions. Care to add some?' })
      return
    }
    console.log(questions)
    res.status(200).json({
      success: true,
      message: `Questions loaded!`,
      questions
    })
  }).catch(err => {
    console.log(err)
    res.status(500).json({
      success: false,
      message: 'Cannot find quiz with id ' + id,
      errors: err
    })
  })
})

router.get('/getQuizById/:id', (req, res) => {
  const id = req.params.id
  Quiz.findById(id).then(quiz => {
    User.findById(quiz.creatorId).then(user => {
      Question.find({quizId: id}).then(allQuestions => {
        const creator = user.username
        res.status(200).json({
          success: true,
          message: `Questions loaded!`,
          allQuestions,
          quiz,
          creator
        })
      })
    }).catch(err => {
      res.status(500).json({
        success: false,
        message: 'Cannot find user with id ' + quiz.create,
        errors: err
      })
    })
  }).catch(err => {
    console.log(err)
    res.status(500).json({
      success: false,
      message: 'Cannot find quiz with id ' + id,
      errors: err
    })
  })
})

router.post('/addSolvedQuiz', (req, res) => {
  const quizData = req.body
  const solvedQuiz = {
    quizId: quizData.quizId,
    solvedBy: quizData.userId,
    questions: quizData.questions,
    answers: quizData.answers,
    dateSolved: new Date()
  }
  // TODO: validate!
  helpers.getScore(quizData.questions, quizData.answers, function (scoreResult) {
    SolvedQuiz.create(solvedQuiz).then(quiz => {
      res.status(200).json({
        success: true,
        message: `Solved Quiz added!`,
        quiz,
        scoreResult
      })
    }).catch(err => {
      console.log('Error: ' + err)
      return res.status(500).json({
        success: false,
        message: 'Cannot write the solved quiz in database',
        errors: 'Quiz solved error'
      })
    })
  })
  // console.log(solvedQuiz)
})

router.get('/getQuestionById/:id', (req, res) => {
  const id = req.params.id
  Question.findById(id).then(question => {
    const questionData = {
      question: question.question,
      answers: question.answers,
      correctAnswers: question.correctAnswers,
      quizId: question.quizId,
      questionNumber: question.number
    }
    console.log(question)
    res.status(200).json({
      success: true,
      message: `Question loaded!`,
      questionData
    })
  }).catch(err => {
    console.log(err)
    res.status(500).json({
      success: false,
      message: 'Cannot find question with id ' + id,
      errors: err
    })
  })
})

router.put('/editQuestion/:id', authCheck, (req, res) => {
  const id = req.params.id
  const questionData = req.body
  const questionToEdit = {
    quizId: questionData.quizId,
    question: questionData.question.trim(),
    answers: questionData.answers,
    correctAnswers: questionData.correctAnswers,
    number: questionData.questionNumber
  }
  console.log(questionToEdit)
  Question.findByIdAndUpdate(id, questionToEdit, {upsert: true}, function (err, doc) {
    if (err) {
      return res.send(500, { error: err })
    }
    console.log(doc)
    res.status(200).json({
      success: true,
      message: `Question ${questionToEdit.question} edited!`,
      questionToEdit
    })
  }).catch(err => {
    console.log('Error: ' + err)
    return res.status(500).json({
      success: false,
      message: 'Cannot write the qusetion in database',
      errors: 'Question error'
    })
  })
})

router.delete('/deleteQuestion/:id', authCheck, (req, res) => {
  const id = req.params.id
  Question.findByIdAndRemove(id, function (err, doc) {
    if (err) {
      return res.send(500, { error: err })
    }
    console.log(doc)
    res.status(200).json({
      success: true,
      message: `Question removed!`
    })
  }).catch(err => {
    console.log('Error: ' + err)
    return res.status(500).json({
      success: false,
      message: 'Cannot delete the qusetion in database',
      errors: 'Question error'
    })
  })
})

module.exports = router
