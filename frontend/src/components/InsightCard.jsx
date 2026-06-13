import { motion } from 'framer-motion';

const InsightCard = ({ number, insight, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="glass-card p-4 hover:border-violet/20 transition-all hover:shadow-lg hover:shadow-violet/5 group"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center">
            <span className="text-violet font-bold text-sm">{number}</span>
          </div>
        </div>
        <p className="text-text-primary text-sm leading-relaxed flex-1 group-hover:text-white transition-colors">
          {insight}
        </p>
      </div>
    </motion.div>
  );
};

export default InsightCard;
