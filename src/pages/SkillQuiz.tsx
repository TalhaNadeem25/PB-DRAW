import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Brain, ArrowCounterClockwise, Trophy } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const QUESTIONS = [
  {
    question: "How long have you been playing Pickleball?",
    options: [
      { id: "1a", text: "Just starting (< 1 month)", score: 2.0 },
      { id: "1b", text: "A few months", score: 2.5 },
      { id: "1c", text: "1-2 years", score: 3.0 },
      { id: "1d", text: "2+ years, play regularly", score: 3.5 },
    ],
  },
  {
    question: "How would you describe your serve?",
    options: [
      { id: "2a", text: "Just trying to get it over the net", score: 2.0 },
      { id: "2b", text: "Reliable but relatively slow", score: 2.5 },
      { id: "2c", text: "Consistent with some pace and depth", score: 3.0 },
      { id: "2d", text: "Powerful, deep, with intent", score: 3.5 },
    ],
  },
  {
    question: "How familiar are you with the 'kitchen' (NVZ) rules?",
    options: [
      { id: "3a", text: "Still learning the rules", score: 2.0 },
      { id: "3b", text: "I know the rules, but sometimes forget and step in", score: 2.5 },
      { id: "3c", text: "Very familiar, I rarely foot fault", score: 3.0 },
      { id: "3d", text: "Expert level, I use the NVZ rules to my advantage", score: 3.5 },
    ],
  },
  {
    question: "How is your dinking game?",
    options: [
      { id: "4a", text: "I try to avoid the kitchen line", score: 2.0 },
      { id: "4b", text: "Can sustain short dink rallies but often pop it up", score: 2.5 },
      { id: "4c", text: "Comfortable dinking and moving opponents", score: 3.0 },
      { id: "4d", text: "Patient, waiting for a dead dink to attack", score: 3.5 },
    ],
  },
  {
    question: "Can you hit a reliable 3rd shot drop?",
    options: [
      { id: "5a", text: "What is a 3rd shot drop?", score: 2.0 },
      { id: "5b", text: "I know it, but I usually drive the ball instead", score: 2.5 },
      { id: "5c", text: "Sometimes, but I miss or pop it up often", score: 3.0 },
      { id: "5d", text: "Yes, I use it consistently to get to the line", score: 3.5 },
    ],
  },
];

const SkillQuiz = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  const handleSelectOption = (score: number) => {
    setAnswers({ ...answers, [currentStep]: score });
    
    // Auto-advance after brief delay for selection feedback
    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsFinished(true);
      }
    }, 300);
  };

  const calculateRating = () => {
    let totalScore = 0;
    Object.values(answers).forEach((score) => {
      totalScore += score;
    });
    
    const avgScore = totalScore / QUESTIONS.length;
    
    // Convert to USAPA scale loosely based on the points
    if (avgScore <= 2.2) return "2.5";
    if (avgScore <= 2.7) return "3.0";
    if (avgScore <= 3.2) return "3.5";
    if (avgScore <= 3.4) return "4.0";
    return "4.5+";
  };

  const getRatingDescription = (rating: string) => {
    switch(rating) {
      case "2.5": return "You are a beginner! You are learning to keep score, starting to get the ball over the net, and having fun.";
      case "3.0": return "You have some experience. You understand the basic rules, can sustain short rallies, and have a reliable serve.";
      case "3.5": return "You are an intermediate player. You can dink, attempt 3rd shot drops, and construct points strategically.";
      case "4.0": return "You are an advanced player. You have a reliable 3rd shot drop, understand positioning, and penalize opponent mistakes.";
      default: return "You are a highly skilled player! You have mastery over shots, spin, and fast-paced kitchen exchanges.";
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentStep(0);
    setIsFinished(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background flex flex-col pt-8">
        <div className="container mx-auto max-w-2xl px-4 flex-1 flex flex-col">
          <Link to="/tournaments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Tournaments
          </Link>

          {!isFinished ? (
            <div className="animate-fade-in flex-1 flex flex-col justify-center pb-24">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-black text-foreground mb-2">
                  What's your Pickleball skill level?
                </h1>
                <p className="text-muted-foreground">
                  Question {currentStep + 1} of {QUESTIONS.length}
                </p>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-6 max-w-md mx-auto">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-in-out" 
                    style={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <Card className="border-border/60 shadow-lg">
                <CardContent className="p-8 pb-10">
                  <h2 className="text-xl font-semibold mb-6 text-center">
                    {QUESTIONS[currentStep].question}
                  </h2>
                  <div className="grid gap-3">
                    {QUESTIONS[currentStep].options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(option.score)}
                        className={cn(
                          "p-4 text-left rounded-xl border-2 transition-all duration-200",
                          answers[currentStep] === option.score
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/60 bg-transparent hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <span className={cn(
                          "font-medium",
                          answers[currentStep] === option.score ? "text-primary font-bold" : "text-foreground"
                        )}>
                          {option.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation buttons below card */}
              <div className="flex justify-between mt-6 max-w-sm mx-auto w-full">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="font-display uppercase tracking-wider text-xs font-bold"
                >
                  Previous
                </Button>
                {answers[currentStep] !== undefined && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      if (currentStep < QUESTIONS.length - 1) setCurrentStep(currentStep + 1);
                      else setIsFinished(true);
                    }}
                    className="font-display uppercase tracking-wider text-xs font-bold text-primary hover:text-primary hover:bg-primary/10"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in flex-1 flex flex-col justify-center items-center pb-24">
              <div className="w-24 h-24 rounded-full bg-hero-gradient flex items-center justify-center mb-6 shadow-lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-display font-black text-center mb-2">
                Your Estimated Rating: <span className="text-primary">{calculateRating()}</span>
              </h1>
              
              <p className="text-muted-foreground text-center max-w-md mx-auto mb-8 leading-relaxed">
                {getRatingDescription(calculateRating())}
              </p>
              
              <div className="grid gap-4 w-full max-w-sm">
                <Button className="font-display uppercase tracking-widest font-bold h-14 rounded-xl" asChild>
                  <Link to={`/tournaments?skill=${calculateRating()}`}>
                    Find Tournaments for My Level
                  </Link>
                </Button>
                <Button variant="outline" className="font-display uppercase tracking-widest font-bold h-14 rounded-xl" onClick={handleRetake}>
                  <ArrowCounterClockwise className="w-4 h-4 mr-2" /> Retake Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SkillQuiz;
