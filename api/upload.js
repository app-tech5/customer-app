import { ApiClient } from './client';

ApiClient.prototype.uploadPublicFile = async function (asset, folder = 'avatars') {
  const uri = typeof asset === 'string' ? asset : asset.uri;
  const formData = new FormData();
  formData.append('folder', folder);
  formData.append('image', {
    uri,
    type: typeof asset === 'string' ? 'image/jpeg' : (asset.mimeType || 'image/jpeg'),
    name: typeof asset === 'string' ? 'upload.jpg' : (asset.fileName || 'upload.jpg'),
  });

  const data = await this.apiCallMultipart('/upload/public', {
    method: 'POST',
    body: formData,
  });
  return data.url;
};
