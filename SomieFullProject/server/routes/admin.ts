/**
 * Admin Routes for SOMIE Platform
 * 
 * This file contains all API routes related to the Super Admin functionality.
 * All routes are protected by admin authentication middleware.
 */
import { Express, Request, Response, NextFunction } from "express";
import { eq, and, like, desc, asc, sql, count, isNull } from "drizzle-orm";
import { 
  users, userRoleEnum, BusinessProfile, InfluencerProfile, 
  Offer, OfferClaim, adminLogs, systemSettings, reportedContent
} from "../../shared/schema";
import { IStorage } from "../types";

/**
 * Middleware to ensure the user has admin privileges
 */
const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: "Access denied" });
  }
  
  next();
};

/**
 * Middleware for super admin only routes
 */
const requireSuperAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  next();
};

/**
 * Log an admin action
 */
const logAdminAction = async (
  storage: IStorage,
  adminId: number,
  action: string,
  entityType: string,
  entityId?: number,
  details?: any,
  req?: Request
) => {
  try {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] as string || null;
    
    await storage.db.insert(adminLogs).values({
      adminId,
      action,
      entityType,
      entityId,
      details: details ? details : null,
      ipAddress: ipAddress || null,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
};

export function registerAdminRoutes(app: Express, storage: IStorage) {
  /**
   * Get system statistics for the admin dashboard
   */
  app.get('/api/admin/stats', requireAdmin, async (req: any, res) => {
    try {
      // Get counts for various entities
      const userCount = await storage.db.select({ count: count() }).from(users);
      const businessCount = await storage.db.select({ count: count() }).from(storage.businessProfiles);
      const influencerCount = await storage.db.select({ count: count() }).from(storage.influencerProfiles);
      const activeOffers = await storage.db.select({ count: count() }).from(storage.offers)
        .where(eq(storage.offers.status, 'active'));
      const completedClaims = await storage.db.select({ count: count() }).from(storage.offerClaims)
        .where(eq(storage.offerClaims.status, 'completed'));
      
      // Calculate platform revenue (simplified)
      // In a real implementation, this would calculate based on transaction fees
      const platformRevenue = {
        total: 0,
        lastMonth: 0,
        growth: 0
      };
      
      const pendingReports = await storage.db.select({ count: count() }).from(reportedContent)
        .where(eq(reportedContent.status, 'pending'));
      
      res.json({
        userCount: userCount[0].count,
        businessCount: businessCount[0].count,
        influencerCount: influencerCount[0].count,
        activeOffers: activeOffers[0].count,
        completedClaims: completedClaims[0].count,
        platformRevenue,
        pendingReports: pendingReports[0].count
      });
      
      // Log this admin action
      await logAdminAction(
        storage,
        req.user.id,
        "view_stats",
        "system",
        undefined,
        undefined,
        req
      );
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  /**
   * User Management Routes
   */
  app.get('/api/admin/users', requireAdmin, async (req: any, res) => {
    try {
      const { 
        search = '',
        userType = null,
        role = null,
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = storage.db.select().from(users);
      
      // Apply filters
      if (search) {
        query = query.where(like(users.username, `%${search}%`));
      }
      
      if (userType) {
        query = query.where(eq(users.userType, userType));
      }
      
      if (role) {
        query = query.where(eq(users.role, role));
      }
      
      // Sort
      if (sortOrder === 'desc') {
        query = query.orderBy(desc(users[sortBy as keyof typeof users]));
      } else {
        query = query.orderBy(asc(users[sortBy as keyof typeof users]));
      }
      
      // Pagination
      query = query.limit(limit).offset(offset);
      
      const userList = await query;
      const totalCount = await storage.db.select({ count: count() }).from(users);
      
      res.json({
        users: userList,
        pagination: {
          total: totalCount[0].count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount[0].count / limit)
        }
      });
      
      await logAdminAction(
        storage,
        req.user.id,
        "list_users",
        "user",
        undefined,
        { filters: { search, userType, role } },
        req
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/users/:id', requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    
    try {
      const user = await storage.getUser(Number(id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get associated profile based on user type
      let profile = null;
      if (user.userType === "business") {
        profile = await storage.getBusinessProfileByUserId(user.id);
      } else if (user.userType === "influencer") {
        profile = await storage.getInfluencerProfileByUserId(user.id);
      }
      
      res.json({ user, profile });
      
      await logAdminAction(
        storage,
        req.user.id,
        "view_user",
        "user",
        Number(id),
        undefined,
        req
      );
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  app.patch('/api/admin/users/:id', requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { role, permissions } = req.body;
    
    try {
      // Only allow updating role and permissions
      const updateData: Record<string, any> = {};
      
      if (role) {
        // Validate the role is one of the allowed values
        if (!['user', 'influencer', 'business', 'admin', 'super_admin'].includes(role)) {
          return res.status(400).json({ message: "Invalid role specified" });
        }
        
        // Only super admins can promote to admin or super_admin
        if (['admin', 'super_admin'].includes(role) && req.user.role !== 'super_admin') {
          return res.status(403).json({ message: "Only super admins can assign admin privileges" });
        }
        
        updateData.role = role;
      }
      
      if (permissions) {
        // Make sure permissions is an array of strings
        if (!Array.isArray(permissions)) {
          return res.status(400).json({ message: "Permissions must be an array" });
        }
        updateData.permissions = permissions;
      }
      
      // Update the user
      const [updatedUser] = await storage.db.update(users)
        .set(updateData)
        .where(eq(users.id, Number(id)))
        .returning();
      
      res.json({ user: updatedUser });
      
      await logAdminAction(
        storage,
        req.user.id,
        "update_user",
        "user",
        Number(id),
        { updatedFields: Object.keys(updateData) },
        req
      );
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  /**
   * Offer Management Routes
   */
  app.get('/api/admin/offers', requireAdmin, async (req: any, res) => {
    try {
      const { 
        status = null,
        businessId = null,
        search = '',
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = storage.db.select({
        offer: storage.offers,
        business: storage.businessProfiles
      })
      .from(storage.offers)
      .leftJoin(storage.businessProfiles, eq(storage.offers.businessId, storage.businessProfiles.id));
      
      // Apply filters
      if (status) {
        query = query.where(eq(storage.offers.status, status));
      }
      
      if (businessId) {
        query = query.where(eq(storage.offers.businessId, Number(businessId)));
      }
      
      if (search) {
        query = query.where(
          like(storage.offers.title, `%${search}%`)
        );
      }
      
      // Sort
      if (sortOrder === 'desc') {
        query = query.orderBy(desc(storage.offers[sortBy as keyof typeof storage.offers]));
      } else {
        query = query.orderBy(asc(storage.offers[sortBy as keyof typeof storage.offers]));
      }
      
      // Pagination
      query = query.limit(limit).offset(offset);
      
      const results = await query;
      const totalCount = await storage.db.select({ count: count() }).from(storage.offers);
      
      res.json({
        offers: results.map(r => ({
          ...r.offer,
          business: r.business
        })),
        pagination: {
          total: totalCount[0].count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount[0].count / limit)
        }
      });
      
      await logAdminAction(
        storage,
        req.user.id,
        "list_offers",
        "offer",
        undefined,
        { filters: { status, businessId, search } },
        req
      );
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.patch('/api/admin/offers/:id', requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      // Only allow updating status
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Validate status
      if (!['active', 'inactive', 'pending', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const [updatedOffer] = await storage.db.update(storage.offers)
        .set({ status })
        .where(eq(storage.offers.id, Number(id)))
        .returning();
      
      res.json({ offer: updatedOffer });
      
      await logAdminAction(
        storage,
        req.user.id,
        "update_offer_status",
        "offer",
        Number(id),
        { status },
        req
      );
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(500).json({ message: "Failed to update offer" });
    }
  });

  /**
   * Report Management Routes
   */
  app.get('/api/admin/reports', requireAdmin, async (req: any, res) => {
    try {
      const { 
        status = null, 
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = storage.db.select().from(reportedContent);
      
      // Apply filters
      if (status) {
        query = query.where(eq(reportedContent.status, status));
      }
      
      // Sort
      if (sortOrder === 'desc') {
        query = query.orderBy(desc(reportedContent[sortBy as keyof typeof reportedContent]));
      } else {
        query = query.orderBy(asc(reportedContent[sortBy as keyof typeof reportedContent]));
      }
      
      // Pagination
      query = query.limit(limit).offset(offset);
      
      const reports = await query;
      const totalCount = await storage.db.select({ count: count() }).from(reportedContent);
      
      res.json({
        reports,
        pagination: {
          total: totalCount[0].count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount[0].count / limit)
        }
      });
      
      await logAdminAction(
        storage,
        req.user.id,
        "list_reports",
        "report",
        undefined,
        { filters: { status } },
        req
      );
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.patch('/api/admin/reports/:id', requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { status, actionTaken } = req.body;
    
    try {
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Validate status
      if (!['pending', 'reviewed', 'actioned', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const [updatedReport] = await storage.db.update(reportedContent)
        .set({ 
          status,
          reviewedBy: req.user.id,
          reviewedAt: new Date()
        })
        .where(eq(reportedContent.id, Number(id)))
        .returning();
      
      res.json({ report: updatedReport });
      
      await logAdminAction(
        storage,
        req.user.id,
        "update_report",
        "report",
        Number(id),
        { status, actionTaken },
        req
      );
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  /**
   * System Settings Routes
   */
  app.get('/api/admin/settings', requireAdmin, async (req: any, res) => {
    try {
      const { category } = req.query;
      
      let query = storage.db.select().from(systemSettings);
      
      if (category) {
        query = query.where(eq(systemSettings.category, category));
      }
      
      const settings = await query;
      
      res.json({ settings });
      
      await logAdminAction(
        storage,
        req.user.id,
        "view_settings",
        "settings",
        undefined,
        { category },
        req
      );
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/admin/settings/:key', requireAdmin, async (req: any, res) => {
    const { key } = req.params;
    const { value } = req.body;
    
    try {
      if (value === undefined) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      // Check if setting exists
      const existingSetting = await storage.db.select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, key));
      
      if (!existingSetting.length) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      const [updatedSetting] = await storage.db.update(systemSettings)
        .set({ 
          settingValue: value,
          updatedBy: req.user.id,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.settingKey, key))
        .returning();
      
      res.json({ setting: updatedSetting });
      
      await logAdminAction(
        storage,
        req.user.id,
        "update_setting",
        "setting",
        undefined,
        { key, value },
        req
      );
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  /**
   * Admin Logs Routes
   */
  app.get('/api/admin/logs', requireSuperAdmin, async (req: any, res) => {
    try {
      const { 
        adminId = null,
        action = null,
        entityType = null,
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = storage.db.select({
        log: adminLogs,
        admin: users
      })
      .from(adminLogs)
      .leftJoin(users, eq(adminLogs.adminId, users.id));
      
      // Apply filters
      if (adminId) {
        query = query.where(eq(adminLogs.adminId, Number(adminId)));
      }
      
      if (action) {
        query = query.where(eq(adminLogs.action, action));
      }
      
      if (entityType) {
        query = query.where(eq(adminLogs.entityType, entityType));
      }
      
      // Sort
      if (sortOrder === 'desc') {
        query = query.orderBy(desc(adminLogs[sortBy as keyof typeof adminLogs]));
      } else {
        query = query.orderBy(asc(adminLogs[sortBy as keyof typeof adminLogs]));
      }
      
      // Pagination
      query = query.limit(limit).offset(offset);
      
      const results = await query;
      const totalCount = await storage.db.select({ count: count() }).from(adminLogs);
      
      res.json({
        logs: results.map(r => ({
          ...r.log,
          admin: {
            id: r.admin.id,
            username: r.admin.username,
            role: r.admin.role
          }
        })),
        pagination: {
          total: totalCount[0].count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount[0].count / limit)
        }
      });
      
      await logAdminAction(
        storage,
        req.user.id,
        "view_admin_logs",
        "admin_log",
        undefined,
        { filters: { adminId, action, entityType } },
        req
      );
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  return {
    logAdminAction
  };
}