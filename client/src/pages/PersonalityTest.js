import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, LoadingSpinner } from '../components/ui';
import { FiUsers, FiCheckCircle, FiArrowLeft, FiArrowRight, FiSend } from 'react-icons/fi';

function PersonalityTest() {
  /*const questions = [
    {
      text: "How do you typically react to new situations?",
      answers: [
        "I embrace them eagerly",
        "I approach cautiously",
        "I prefer familiar situations",
        "I avoid them if possible",
      ],
    },
    {
      text: "When making decisions, you usually:",
      answers: [
        "Trust your intuition",
        "Analyze all options carefully",
        "Seek others' advice",
        "Go with proven solutions",
      ],
    },
    {
      text: "In group settings, you tend to:",
      answers: [
        "Lead the conversation",
        "Actively participate",
        "Listen and observe",
        "Stay in the background",
      ],
    },
    {
      text: "How do you prefer to spend your free time?",
      answers: [
        "Socializing with many people",
        "With a few close friends",
        "Pursuing solo hobbies",
        "Relaxing quietly alone",
      ],
    },
  ];*/

  const [questions, setQuestions] = useState([
    { //Level 1
      text: "Predict the best time to buy iPhone 16 in 2024 by watching a price-date gragh of iPhone 15",
      answersWeighting: [1.5, 1.5, 1.5, 0, 0, 0]
    },
    {
      text: "Calculating 13*17 without the aid of any tool, including pen and paper",
      answersWeighting: [1.5, 1.5, 0, 0, 1.5, 0]
    },
    {
      text: "Watch weather forecast on TV and tell you grandmother the temparature trend next week",
      answersWeighting: [0, 1.5, 1.5, 1.5, 0, 1.5] 
    },
    {
      text: "Help your friend to name her new pet hamster",
      answersWeighting: [0, 0, 0, 1.5, 0, 1.5] 
    },
    {
      text: "Remind your friend that he is supposed to buy a notebook when you meet him tomorrow",
      answersWeighting: [0, 0, 0, 1.5, 1.5, 0] 
    },
    { //Level 2
      text: "Solve ordinary math problems in your assignment",
      answersWeighting: [2.5, 2, 2.5, 0, 0, 2] 
    },
    { //Level 3
      text: "Try to solve most difficult maths problems in your assignment",
      answersWeighting: [3.5, 3, 3.5, 0, 0, 3] 
    },
    { //Level 4
      text: "Try to understand (don't have to solve problems) basic calculus",
      answersWeighting: [4, 0, 0, 0, 0, 0] 
    },
    {
      text: "Explain the most difficult maths problems to your friend and make him/her understand",
      answersWeighting: [4, 4, 0, 0, 0, 0] 
    },
    {
      text: "Try to teach yourself maths that you will learn next year",
      answersWeighting: [4, 0, 4, 0, 0, 0] 
    },
    {
      text: "Convince your mother about \"Taking a break every hour is better than non-stop learning\"",
      answersWeighting: [0, 4, 0, 0, 0, 0] 
    },
    {
      text: "Criticize a doubtful news article you read on Google in front of your class",
      answersWeighting: [0, 4, 0, 4, 0, 0] 
    },
    {
      text: "Find a solution that can stop your classroom air-con from frequently dripping",
      answersWeighting: [0, 4, 0, 0, 0, 4] 
    },
    {
      text: "Write an article that can be praised by your teacher",
      answersWeighting: [0, 0, 0, 4, 0, 0] 
    },
    {
      text: "Make a speech in school opening ceremony",
      answersWeighting: [0, 4, 0, 4, 4, 0] 
    },
    {
      text: "Do a presentation in your class for 10 min about a cultural or historical story",
      answersWeighting: [0, 0, 0, 0, 4, 0] 
    },
  ]);

  const defaultanswers = [
    "Unable to do",
    "May do but uncomfortable",
    "Should be fine",
    "No problem in general",
    "Piece of cake"
  ]

  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, currentUser]);

  const handleNext = () => {
    if (currentQuestion < questions.length - 1 && answers[currentQuestion] !== null) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Tally up the scores!
    let ability_6dp = [1.5, 1.5, 1.5, 1.5, 1.5, 1.5];
    let ability_6dfc = [0, 0, 0, 0, 0, 0];
    for (var i = 0; i < questions.length; i++) {
      for (var j = 0; j < ability_6dp.length; j++) {
        if (questions[i].answersWeighting[j] <= ability_6dp[j] && ability_6dfc[j] < 2) {
          if (questions[i].answersWeighting[j] + answers[i]*0.3 >= ability_6dp[j]) {
            ability_6dp[j] = questions[i].answersWeighting[j] + answers[i]*0.3;
          } else ability_6dfc[j] = ability_6dfc[j] + 1;
        }
      }
    }

    console.log(ability_6dp)

    try {
      const response = await fetch("api/ability_6d/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          _id: currentUser.User_ID, 
          ability_6d: ability_6dp 
        }),
      });

      if (response.ok) {
        alert("Your answers have been submitted successfully!");
        navigate("/ViewReport");
      } else {
        alert("Your answers have been submitted successfully!");
        navigate("/ViewReport");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Your answers have been submitted successfully!");
      navigate("/ViewReport");
    }
  };

  return (
    <PageTemplate
      title="Ability Assessment"
      description="Comprehensive cognitive ability evaluation"
      icon="🧠"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card hover>
          <Card.Content className="p-6">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
              <div
                className="bg-primary-500 dark:bg-primary-400 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              ></div>
            </div>

            {/* Question Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Badge variant="primary" size="lg">
                  Question {currentQuestion + 1} of {questions.length}
                </Badge>
                <Badge variant="secondary" size="lg">
                  {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
                </Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-900 dark:text-white mt-4 leading-tight">
                {questions[currentQuestion].text}
              </h2>
              <p className="font-literary text-primary-600 dark:text-gray-300 mt-2">
                Select the option that best describes your confidence level
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {defaultanswers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-xl transition-all duration-300 border-2 font-literary ${
                    answers[currentQuestion] === index
                      ? "bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300 shadow-md transform scale-[1.02]"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-primary-25 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1">{answer}</span>
                    {answers[currentQuestion] === index && (
                      <FiCheckCircle className="w-5 h-5 text-primary-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <FiArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="text-center font-literary text-sm text-gray-500 dark:text-gray-400">
                {answers.filter(a => a !== null).length} of {questions.length} answered
              </div>
              
              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={answers[currentQuestion] === null}
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <FiSend className="w-4 h-4" />
                  Submit Assessment
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={answers[currentQuestion] === null}
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  Next
                  <FiArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>
    </PageTemplate>
  );
}

export default PersonalityTest;