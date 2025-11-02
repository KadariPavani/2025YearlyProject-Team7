const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');

// Get unique tech stacks from existing batches
async function getAvailableTechStacks() {
  try {
    const techStacks = await PlacementTrainingBatch.getAvailableTechStacks();
    return techStacks;
  } catch (error) {
    console.error('Error fetching tech stacks:', error);
    return [];
  }
}

// Format tech stack for display
function getTechStackColor(techStack) {
  // Use HSL color generator for dynamic colors
  const hashCode = str => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const hue = Math.abs(hashCode(techStack)) % 360;
  
  if (techStack === 'NonCRT') {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return `bg-[hsl(${hue},85%,95%)] text-[hsl(${hue},75%,35%)] border-[hsl(${hue},75%,90%)]`;
}

module.exports = {
  getAvailableTechStacks,
  getTechStackColor
};
