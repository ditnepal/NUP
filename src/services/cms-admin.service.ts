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
