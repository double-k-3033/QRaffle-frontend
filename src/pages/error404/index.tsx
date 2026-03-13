import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PageTransition, FadeInWhenVisible } from "@/components/animations";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";

const Error404: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Page Not Found - 404 Error | Qraffle"
        description="The page you're looking for doesn't exist. Return to Qraffle to explore fair and transparent Qubic raffles with DAO governance."
        url="/404"
        noindex={true}
      />
      <PageTransition className="flex min-h-screen flex-col items-center justify-center">
        <FadeInWhenVisible delay={0.2}>
          <motion.h1
            className="text-foreground text-7xl font-bold"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            404
          </motion.h1>
        </FadeInWhenVisible>

        <FadeInWhenVisible delay={0.4}>
          <motion.p
            className="text-muted-foreground mt-4 text-2xl"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            Page Not Found
          </motion.p>
        </FadeInWhenVisible>

        <FadeInWhenVisible delay={0.6}>
          <div className="mt-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate("/")} className="transform transition-all duration-300 hover:shadow-lg">
                Go back to Home
              </Button>
            </motion.div>
          </div>
        </FadeInWhenVisible>
      </PageTransition>
    </>
  );
};

export default Error404;
