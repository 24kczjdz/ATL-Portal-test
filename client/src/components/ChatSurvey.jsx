import React, { useState } from 'react';
import { Card, Button, Badge, Input } from './ui';
import { 
  FiStar, 
  FiHeart, 
  FiThumbsUp, 
  FiCheckCircle, 
  FiX, 
  FiMessageCircle
} from 'react-icons/fi';

const ChatSurvey = ({ chatId, onSubmit, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [ratings, setRatings] = useState({
    overallExperience: 0,
    suggestions: '',
    primaryIntent: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const questions = [
    {
      id: 'overallExperience',
      title: 'How satisfied are you with today\'s conversation experience?',
      type: 'rating',
      required: true,
      icon: FiHeart,
      color: 'danger'
    },
    {
      id: 'suggestions',
      title: 'Is there anything we can do better?',
      type: 'textarea',
      required: false,
      placeholder: 'Your suggestions for improvement... (Optional)',
      icon: FiThumbsUp,
      color: 'success'
    },
    {
      id: 'primaryIntent',
      title: 'What information were you primarily looking for today?',
      type: 'textarea',
      required: false,
      placeholder: 'Tell us what you were looking for... (Optional)',
      icon: FiMessageCircle,
      color: 'primary'
    }
  ];

  const handleStarClick = (rating) => {
    setRatings(prev => ({ ...prev, overallExperience: rating }));
  };

  const handleInputChange = (field, value) => {
    setRatings(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    // Check if required field is filled
    if (currentQuestion.required && currentQuestion.type === 'rating' && ratings[currentQuestion.id] === 0) {
      alert('Please provide a rating to continue');
      return;
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSkip = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const surveyData = {
        chatId,
        timestamp: new Date().toISOString(),
        responses: {
          overallExperience: {
            question: questions[0].title,
            rating: ratings.overallExperience,
            scale: "1-5 stars"
          },
          suggestions: {
            question: questions[1].title,
            response: ratings.suggestions || ''
          },
          primaryIntent: {
            question: questions[2].title,
            response: ratings.primaryIntent || ''
          }
        }
      };

      await onSubmit(surveyData);
      setIsCompleted(true);
      
      // Auto close after showing thank you message
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Failed to submit survey. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex justify-center space-x-3 my-8">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            className="text-4xl focus:outline-none hover:scale-125 transition-all duration-300 transform hover:-translate-y-1"
          >
            <FiStar 
              className={`${
                star <= ratings.overallExperience 
                  ? 'text-warning-500 fill-current drop-shadow-lg' 
                  : 'text-gray-300 dark:text-gray-600 hover:text-warning-300'
              }`} 
            />
          </button>
        ))}
      </div>
    );
  };

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / questions.length) * 100;
    return (
      <div className="w-full bg-primary-100 dark:bg-gray-700 rounded-full h-2 mb-6">
        <div 
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  const renderThankYou = () => {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-success-400 to-primary-500 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-soft-lg">
            <FiCheckCircle className="text-white text-4xl" />
          </div>
          <h2 className="text-3xl font-elegant text-primary-900 dark:text-white mb-3">Thank You!</h2>
          <p className="text-lg font-literary text-primary-600 dark:text-gray-300 mb-6">Your feedback helps us improve</p>
        </div>
        
        <Card className="mb-6">
          <Card.Content className="p-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FiHeart className="text-danger-500 text-xl animate-bounce" />
              <span className="font-serif text-primary-900 dark:text-white font-medium">We appreciate your time!</span>
              <FiHeart className="text-danger-500 text-xl animate-bounce" style={{animationDelay: '0.5s'}} />
            </div>
            <p className="text-sm font-literary text-primary-600 dark:text-gray-300">
              Your insights help us provide better assistance for future conversations.
            </p>
          </Card.Content>
        </Card>

        <div className="flex justify-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
        
        <p className="text-sm font-literary text-primary-500 dark:text-gray-400">This window will close automatically</p>
      </div>
    );
  };

  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md mx-auto transform transition-all duration-300 shadow-soft-xl">
          <Card.Content className="p-8">
            {renderThankYou()}
          </Card.Content>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const IconComponent = currentQuestion.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto transform transition-all duration-300 shadow-soft-xl">
        <Card.Header>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-${currentQuestion.color}-100 dark:bg-${currentQuestion.color}-900/20`}>
                <IconComponent className={`w-5 h-5 text-${currentQuestion.color}-600 dark:text-${currentQuestion.color}-400`} />
              </div>
              <div>
                <Card.Title className="text-xl">Quick Feedback</Card.Title>
                <Card.Description>Help us improve your experience</Card.Description>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              icon={FiX}
            />
          </div>
        </Card.Header>
        <Card.Content className="p-6">
          {renderProgressBar()}

          <div className="mb-8">
            <div className="text-center mb-6">
              <Badge variant="neutral" size="sm">
                Question {currentStep + 1} of {questions.length}
              </Badge>
            </div>
            
            <h3 className="text-lg font-serif text-primary-900 dark:text-white mb-6 text-center leading-relaxed">
              {currentQuestion.title}
              {!currentQuestion.required && (
                <span className="text-sm font-literary text-primary-500 dark:text-gray-400 font-normal block mt-2">(Optional)</span>
              )}
            </h3>

          {currentQuestion.type === 'rating' && (
            <div>
              {renderStars()}
              <div className="flex justify-between text-xs font-literary text-primary-500 dark:text-gray-400 mt-3 px-4">
                <span>Very Unsatisfied</span>
                <span>Very Satisfied</span>
              </div>
              {ratings.overallExperience > 0 && (
                <div className="text-center mt-4">
                  <Badge variant="success" size="sm">
                    {ratings.overallExperience} star{ratings.overallExperience > 1 ? 's' : ''} selected
                  </Badge>
                </div>
              )}
            </div>
          )}

          {currentQuestion.type === 'textarea' && (
            <Input
              type="textarea"
              rows={4}
              value={ratings[currentQuestion.id]}
              onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="resize-none"
            />
          )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center gap-3 pt-4">
            {currentStep > 0 && (
              <Button
                onClick={handlePrevious}
                variant="ghost"
                size="sm"
                className="flex-1 max-w-[140px]"
              >
                Previous
              </Button>
            )}
            
            <Button
              onClick={handleSkip}
              disabled={isSubmitting}
              variant="secondary"
              size="sm"
              className="flex-1 max-w-[140px]"
            >
              {currentStep === questions.length - 1 ? 'Skip & Finish' : 'Skip'}
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              variant="primary"
              size="sm"
              className="flex-1 max-w-[140px]"
              loading={isSubmitting}
            >
              {currentStep === questions.length - 1 ? 'Submit Feedback' : 'Next'}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ChatSurvey;
