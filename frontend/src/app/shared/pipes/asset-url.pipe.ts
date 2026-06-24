import { Pipe, PipeTransform } from '@angular/core';
import { resolveAssetUrl } from '../../core/utils/asset-url.util';

@Pipe({ name: 'assetUrl', standalone: true })
export class AssetUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    return resolveAssetUrl(url);
  }
}
