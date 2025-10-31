import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from '@zxing/browser';
import {
  BarcodeFormat,
  DecodeHintType
} from '@zxing/library';
import { CommonModule } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';

@Component({
  selector: 'app-barcode-scanner',
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.css'],
  imports: [CommonModule, NgIconComponent],
})
export class BarcodeScannerComponent implements OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @Output() scanSuccess = new EventEmitter<string>();

  showPopup = false;
  scanning = false;

  private codeReader: BrowserMultiFormatReader;
  private controls: IScannerControls | null = null;

  constructor() {
    /** ✅ Limit formats for better accuracy */
    const formats = [
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.QR_CODE,
    ];
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    this.codeReader = new BrowserMultiFormatReader(hints);
  }

  async openScanner() {
    this.showPopup = true;
    await this.startScanner();
  }

  async startScanner() {
    try {
      /** ✅ Get available devices */
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const backCam =
        devices.find((d) => /back|rear|environment/i.test(d.label)) ||
        devices[0];

      if (!backCam) {
        alert('No camera found.');
        return;
      }

      const videoElement = this.video.nativeElement;

      /** ✅ Improve focus and compatibility */
      videoElement.setAttribute('autoplay', 'true');
      videoElement.setAttribute('muted', 'true');
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('autofocus', 'true');

      /** ✅ Use high-resolution video constraints */
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: backCam.deviceId ? { exact: backCam.deviceId } : undefined,
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      videoElement.srcObject = stream;
      await videoElement.play();

      /** ✅ Start decoding continuously */
      this.scanning = true;
      this.controls = await this.codeReader.decodeFromVideoDevice(
        backCam.deviceId,
        videoElement,
        (result, err, controls) => {
          if (result) {
            console.log('✅ Barcode detected:', result.getText());
            this.scanSuccess.emit(result.getText());
            this.closeScanner();
          }

          if (err && !(err.name === 'NotFoundException')) {
            console.error('❌ Scan error:', err);
          }
        }
      );
    } catch (e) {
      console.error('Error starting scanner:', e);
      alert('Unable to access camera. Please allow permissions.');
    }
  }

  closeScanner() {
    if (this.controls) {
      this.controls.stop();
    }
    const videoElement = this.video?.nativeElement;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoElement.srcObject = null;
    }

    this.showPopup = false;
    this.scanning = false;
  }

  ngOnDestroy() {
    this.closeScanner();
  }
}
