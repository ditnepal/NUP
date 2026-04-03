import { BaseService } from './base.service';
import { auditService } from './audit.service';

export class CmsAdminService extends BaseService {
  /**
   * Create or update a page
   */
  async upsertPage(data: {
    id?: string;
    slug: string;
    title: string;
    content: string;
    status: string;
    authorId: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    language?: string;
    isSystem?: boolean;
    isPinned?: boolean;
    publishedAt?: Date;
    decisionNote?: string;
    placement?: 'MAIN_MENU' | 'FOOTER' | 'HIDDEN';
  }) {
    const { id, decisionNote, placement, ...rest } = data;
    const page = id 
      ? await this.db.cmsPage.update({ where: { id }, data: rest })
      : await this.db.cmsPage.create({ data: rest });

    // Handle placement
    if (placement) {
      const pageUrl = `/pages/${page.slug}`;
      const navConfig = await this.db.systemConfig.findUnique({ where: { key: 'CMS_NAVIGATION' } });
      const footerConfig = await this.db.systemConfig.findUnique({ where: { key: 'CMS_FOOTER_LINKS' } });
      
      let navItems: any[] = navConfig ? JSON.parse(navConfig.value) : [];
      let footerItems: any[] = footerConfig ? JSON.parse(footerConfig.value) : [];

      // Remove from both first to ensure clean state
      navItems = navItems.filter(item => item.url !== pageUrl);
      footerItems = footerItems.filter(item => item.url !== pageUrl);

      if (placement === 'MAIN_MENU') {
        navItems.push({
          id: Math.random().toString(36).substring(2, 9),
          label: page.title,
          url: pageUrl,
          order: navItems.length,
          status: page.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else if (placement === 'FOOTER') {
        footerItems.push({
          id: Math.random().toString(36).substring(2, 9),
          label: page.title,
          url: pageUrl,
          order: footerItems.length,
          status: page.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      await this.db.systemConfig.upsert({
        where: { key: 'CMS_NAVIGATION' },
        update: { value: JSON.stringify(navItems) },
        create: { key: 'CMS_NAVIGATION', value: JSON.stringify(navItems) }
      });

      await this.db.systemConfig.upsert({
        where: { key: 'CMS_FOOTER_LINKS' },
        update: { value: JSON.stringify(footerItems) },
        create: { key: 'CMS_FOOTER_LINKS', value: JSON.stringify(footerItems) }
      });
    }

    await auditService.log({
      action: id ? 'CMS_PAGE_UPDATED' : 'CMS_PAGE_CREATED',
      userId: data.authorId,
      entityType: 'CmsPage',
      entityId: page.id,
      details: { slug: data.slug, decisionNote, placement }
    });

    return page;
  }

  /**
   * Delete a page
   */
  async deletePage(id: string, userId: string, decisionNote?: string) {
    const page = await this.db.cmsPage.delete({ where: { id } });
    await auditService.log({
      action: 'CMS_PAGE_DELETED',
      userId,
      entityType: 'CmsPage',
      entityId: id,
      details: { slug: page.slug, decisionNote }
    });
    return page;
  }

  /**
   * Create or update a post
   */
  async upsertPost(data: {
    id?: string;
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
    type: string;
    status: string;
    authorId: string;
    categoryId?: string;
    featuredImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    language?: string;
    isPinned?: boolean;
    publishedAt?: Date;
    decisionNote?: string;
  }) {
    const { id, decisionNote, ...rest } = data;
    const post = id 
      ? await this.db.cmsPost.update({ where: { id }, data: rest })
      : await this.db.cmsPost.create({ data: rest });

    await auditService.log({
      action: id ? 'CMS_POST_UPDATED' : 'CMS_POST_CREATED',
      userId: data.authorId,
      entityType: 'CmsPost',
      entityId: post.id,
      details: { slug: data.slug, type: data.type, decisionNote }
    });

    return post;
  }

  /**
   * Delete a post
   */
  async deletePost(id: string, userId: string, decisionNote?: string) {
    const post = await this.db.cmsPost.delete({ where: { id } });
    await auditService.log({
      action: 'CMS_POST_DELETED',
      userId,
      entityType: 'CmsPost',
      entityId: id,
      details: { slug: post.slug, type: post.type, decisionNote }
    });
    return post;
  }

  /**
   * Create a category
   */
  async createCategory(data: { name: string; slug: string; description?: string; type: string }) {
    return await this.db.cmsCategory.create({ data });
  }

  /**
   * Upload media metadata
   */
  async registerMedia(data: {
    title: string;
    fileName: string;
    fileType: string;
    mimeType: string;
    url: string;
    size: number;
    categoryId?: string;
    uploadedById: string;
  }) {
    return await this.db.cmsMedia.create({ data });
  }

  /**
   * Create a redirect
   */
  async createRedirect(data: { fromPath: string; toPath: string; statusCode?: number }) {
    return await this.db.cmsRedirect.create({ data });
  }

  /**
   * Create a download
   */
  async createDownload(data: { title: string; description?: string; fileUrl: string; fileType: string; category?: string }) {
    return await this.db.cmsDownload.create({ data });
  }

  /**
   * Create or update a section
   */
  async upsertSection(data: {
    id?: string;
    title: string;
    type: string;
    order?: number;
    isEnabled?: boolean;
    content: string;
    authorId: string;
    decisionNote?: string;
  }) {
    const { id, decisionNote, ...rest } = data;
    const section = id 
      ? await this.db.cmsSection.update({ where: { id }, data: rest })
      : await this.db.cmsSection.create({ data: rest });

    await auditService.log({
      action: id ? 'CMS_SECTION_UPDATED' : 'CMS_SECTION_CREATED',
      userId: data.authorId,
      entityType: 'CmsSection',
      entityId: section.id,
      details: { title: data.title, type: data.type, decisionNote }
    });

    return section;
  }

  /**
   * Delete a section
   */
  async deleteSection(id: string, userId: string, decisionNote?: string) {
    const section = await this.db.cmsSection.delete({ where: { id } });
    await auditService.log({
      action: 'CMS_SECTION_DELETED',
      userId,
      entityType: 'CmsSection',
      entityId: id,
      details: { title: section.title, type: section.type, decisionNote }
    });
    return section;
  }
}

export const cmsAdminService = new CmsAdminService();
