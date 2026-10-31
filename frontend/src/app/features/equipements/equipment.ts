import { DemoImageSource } from '../../shared/demo-image/demo-image';

export interface Equipment {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly image?: DemoImageSource;
}
