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
  }) {
    const { id, ...rest } = data;
    const page = id 
      ? await this.db.cmsPage.update({ where: { id }, data: rest })
      : await this.db.cmsPage.create({ data: rest });

    await auditService.log({
      action: id ? 'CMS_PAGE_UPDATED' : 'CMS_PAGE_CREATED',
      userId: data.authorId,
      entityType: 'CmsPage',
      entityId: page.id,
      details: { slug: data.slug }
    });

    return page;
  }

  /**
   * Delete a page
   */
  async deletePage(id: string, userId: string) {
    const page = await this.db.cmsPage.delete({ where: { id } });
    await auditService.log({
      action: 'CMS_PAGE_DELETED',
      userId,
      entityType: 'CmsPage',
      entityId: id,
      details: { slug: page.slug }
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
    language?: string;
    isPinned?: boolean;
    publishedAt?: Date;
  }) {
    const { id, ...rest } = data;
    const post = id 
      ? await this.db.cmsPost.update({ where: { id }, data: rest })
      : await this.db.cmsPost.create({ data: rest });

    await auditService.log({
      action: id ? 'CMS_POST_UPDATED' : 'CMS_POST_CREATED',
      userId: data.authorId,
      entityType: 'CmsPost',
      entityId: post.id,
      details: { slug: data.slug, type: data.type }
    });

    return post;
  }

  /**
   * Delete a post
   */
  async deletePost(id: string, userId: string) {
    const post = await this.db.cmsPost.delete({ where: { id } });
    await auditService.log({
      action: 'CMS_POST_DELETED',
      userId,
      entityType: 'CmsPost',
      entityId: id,
      details: { slug: post.slug, type: post.type }
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
}

export const cmsAdminService = new CmsAdminService();
