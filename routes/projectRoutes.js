import express from 'express';
import Project from '../api/models/Project.js';
import { authMiddleware, adminMiddleware, atlMemberMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all projects (accessible to all authenticated users)
router.get('/projects', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 });
    
    // Add member count to each project
    const projectsWithCount = projects.map(project => ({
      ...project.toObject(),
      memberCount: project.members.length
    }));
    
    res.json(projectsWithCount);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project (ATL Members and Admin only)
router.post('/projects', atlMemberMiddleware, async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      creator: req.user.User_ID,
      members: [req.user.User_ID] // Creator is automatically a member
    });
    
    await project.save();
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's projects (projects they've joined)
router.get('/projects/my-projects', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user.User_ID })
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join project
router.post('/projects/:id/join', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.proj_status === 'completed' || project.proj_status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot join completed or cancelled projects' });
    }
    
    if (project.members.includes(req.user.User_ID)) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }
    
    project.members.push(req.user.User_ID);
    await project.save();
    
    res.json({ message: 'Successfully joined project' });
  } catch (error) {
    console.error('Error joining project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave project
router.delete('/projects/:id/leave', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.creator.toString() === req.user.User_ID.toString()) {
      return res.status(400).json({ message: 'Project creator cannot leave the project' });
    }
    
    if (!project.members.includes(req.user.User_ID)) {
      return res.status(400).json({ message: 'You are not a member of this project' });
    }
    
    project.members = project.members.filter(member => member.toString() !== req.user.User_ID.toString());
    await project.save();
    
    res.json({ message: 'Successfully left project' });
  } catch (error) {
    console.error('Error leaving project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
// Get all projects with full details (Admin only)
router.get('/projects/admin', adminMiddleware, async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 });
    
    // Manually populate creator and member information
    const { models } = await import('../server/database.js');
    const User = models.USER;
    
    const populatedProjects = await Promise.all(projects.map(async (project) => {
      const projectObj = project.toObject();
      
      // Populate creator
      const creator = await User.findOne({ User_ID: project.creator })
        .select('User_ID First_Name Last_Name Email_Address');
      
      // Populate members
      const members = await Promise.all(
        project.members.map(async (memberId) => {
          const member = await User.findOne({ User_ID: memberId })
            .select('User_ID First_Name Last_Name Email_Address');
          return member;
        })
      );
      
      return {
        ...projectObj,
        creator,
        members: members.filter(member => member !== null) // Remove any null results
      };
    }));
    
    res.json(populatedProjects);
  } catch (error) {
    console.error('Error fetching projects for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project as admin
router.post('/projects/admin', adminMiddleware, async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      creator: req.user.User_ID,
      members: [req.user.User_ID]
    });
    
    await project.save();
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project as admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project (Admin only or project creator)
router.put('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is admin or project creator
    const isAdmin = req.user.User_Role === 'ATL_ADMIN';
    const isCreator = project.creator.toString() === req.user.User_ID.toString();
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project (Admin only)
router.delete('/projects/:id', adminMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from project (Admin only)
router.delete('/projects/:projectId/members/:memberId', adminMiddleware, async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.creator.toString() === memberId) {
      return res.status(400).json({ message: 'Cannot remove project creator' });
    }
    
    project.members = project.members.filter(member => member.toString() !== memberId);
    await project.save();
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;