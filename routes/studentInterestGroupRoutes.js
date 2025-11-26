import express from 'express';
import StudentInterestGroup from '../api/models/StudentInterestGroup.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all student interest groups (accessible to all authenticated users)
router.get('/student-interest-groups', authMiddleware, async (req, res) => {
  try {
    const sigs = await StudentInterestGroup.find()
      .sort({ createdAt: -1 });
    
    // Add member count to each group
    const sigsWithCount = sigs.map(sig => ({
      ...sig.toObject(),
      memberCount: sig.members.length
    }));
    
    res.json(sigsWithCount);
  } catch (error) {
    console.error('Error fetching student interest groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's student interest groups (groups they've joined)
router.get('/student-interest-groups/my-groups', authMiddleware, async (req, res) => {
  try {
    const sigs = await StudentInterestGroup.find({ members: req.user.User_ID })
      .sort({ createdAt: -1 });
    
    // Add joinedAt date for user's perspective
    const sigsWithJoinDate = sigs.map(sig => ({
      ...sig.toObject(),
      memberCount: sig.members.length,
      joinedAt: sig.createdAt // Simplified - in production you might want to track actual join dates
    }));
    
    res.json(sigsWithJoinDate);
  } catch (error) {
    console.error('Error fetching user student interest groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join student interest group
router.post('/student-interest-groups/:id/join', authMiddleware, async (req, res) => {
  try {
    const sig = await StudentInterestGroup.findById(req.params.id);
    
    if (!sig) {
      return res.status(404).json({ message: 'Student Interest Group not found' });
    }
    
    if (sig.sig_status === 'inactive') {
      return res.status(400).json({ message: 'Cannot join inactive groups' });
    }
    
    if (sig.members.includes(req.user.User_ID)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }
    
    sig.members.push(req.user.User_ID);
    await sig.save();
    
    res.json({ message: 'Successfully joined Student Interest Group' });
  } catch (error) {
    console.error('Error joining student interest group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave student interest group
router.delete('/student-interest-groups/:id/leave', authMiddleware, async (req, res) => {
  try {
    const sig = await StudentInterestGroup.findById(req.params.id);
    
    if (!sig) {
      return res.status(404).json({ message: 'Student Interest Group not found' });
    }
    
    if (!sig.members.includes(req.user.User_ID)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }
    
    sig.members = sig.members.filter(member => member.toString() !== req.user.User_ID.toString());
    await sig.save();
    
    res.json({ message: 'Successfully left Student Interest Group' });
  } catch (error) {
    console.error('Error leaving student interest group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
// Get all student interest groups with full details (Admin only)
router.get('/student-interest-groups/admin', adminMiddleware, async (req, res) => {
  try {
    const sigs = await StudentInterestGroup.find()
      .sort({ createdAt: -1 });
    
    // Manually populate member information
    const { models } = await import('../server/database.js');
    const User = models.USER;
    
    const populatedSigs = await Promise.all(sigs.map(async (sig) => {
      const sigObj = sig.toObject();
      
      // Populate members
      const members = await Promise.all(
        sig.members.map(async (memberId) => {
          const member = await User.findOne({ User_ID: memberId })
            .select('User_ID First_Name Last_Name Email_Address');
          return member;
        })
      );
      
      return {
        ...sigObj,
        members: members.filter(member => member !== null) // Remove any null results
      };
    }));
    
    res.json(populatedSigs);
  } catch (error) {
    console.error('Error fetching student interest groups for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create student interest group (Admin only)
router.post('/student-interest-groups', adminMiddleware, async (req, res) => {
  try {
    // Check if abbreviation already exists
    const existingSig = await StudentInterestGroup.findOne({ 
      sig_abbrev: req.body.sig_abbrev.toUpperCase() 
    });
    
    if (existingSig) {
      return res.status(400).json({ message: 'Abbreviation already exists' });
    }
    
    const sig = new StudentInterestGroup({
      ...req.body,
      sig_abbrev: req.body.sig_abbrev.toUpperCase()
    });
    
    await sig.save();
    res.status(201).json(sig);
  } catch (error) {
    console.error('Error creating student interest group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student interest group (Admin only)
router.put('/student-interest-groups/:id', adminMiddleware, async (req, res) => {
  try {
    // If updating abbreviation, check for conflicts
    if (req.body.sig_abbrev) {
      const existingSig = await StudentInterestGroup.findOne({ 
        sig_abbrev: req.body.sig_abbrev.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      
      if (existingSig) {
        return res.status(400).json({ message: 'Abbreviation already exists' });
      }
      
      req.body.sig_abbrev = req.body.sig_abbrev.toUpperCase();
    }
    
    const sig = await StudentInterestGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!sig) {
      return res.status(404).json({ message: 'Student Interest Group not found' });
    }
    
    res.json(sig);
  } catch (error) {
    console.error('Error updating student interest group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete student interest group (Admin only)
router.delete('/student-interest-groups/:id', adminMiddleware, async (req, res) => {
  try {
    const sig = await StudentInterestGroup.findByIdAndDelete(req.params.id);
    
    if (!sig) {
      return res.status(404).json({ message: 'Student Interest Group not found' });
    }
    
    res.json({ message: 'Student Interest Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting student interest group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from student interest group (Admin only)
router.delete('/student-interest-groups/:sigId/members/:memberId', adminMiddleware, async (req, res) => {
  try {
    const { sigId, memberId } = req.params;
    const sig = await StudentInterestGroup.findById(sigId);
    
    if (!sig) {
      return res.status(404).json({ message: 'Student Interest Group not found' });
    }
    
    sig.members = sig.members.filter(member => member.toString() !== memberId);
    await sig.save();
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;