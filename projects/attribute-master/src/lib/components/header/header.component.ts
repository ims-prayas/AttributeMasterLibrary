import { Component, HostListener, Input } from '@angular/core';
import { AttributeMasterService } from '../../attribute-master.service';

@Component({
  selector: 'lib-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  @Input() title!: string;

  constructor(private attributeMasterService: AttributeMasterService) {}

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.code === 'F3') {
      event.preventDefault();
      this.onResetClicked();
    }
    if (event.code === 'End') {
      event.preventDefault();
      this.onSaveClicked();
    }
  }

  // onSaveClicked() {
  //   try {
  //     this.attributeMasterService.saveMaster().subscribe({
  //       next: (res: any) => {
  //         if (res.status === 'ok') {
  //           alert(res.result);
  //           this.attributeMasterService.clearTable();
  //           this.attributeMasterService.resetForm();
  //         } else {
  //           alert(res.message || 'Save failed');
  //         }
  //       },
  //       error: () => alert('Error while saving data'),
  //     });

  //     this.attributeMasterService.saveAttributeMapping().subscribe((res: any)=>{
  //       if(res.status == 'ok'){
  //         alert(res.result);
  //         this.attributeMasterService.resetForm();
  //       }
  //     }
  //   )
  //   } catch (err: any) {
  //     alert(err.message);
  //   }
  // }


  // onSaveClicked() {
  //   this.attributeMasterService.saveAttributeMapping().subscribe({
  //     next: (res: any) => {
  //       if (res && res.status === 'ok') {
  //         alert(res.result || 'Saved successfully!');
  //         this.attributeMasterService.resetForm();
  //       } else {
  //         alert(res?.message || 'The server encountered a business logic error.');
  //       }
  //     },
  //     error: (err: any) => {
  //       console.error('Save error:', err);
  //       alert(err?.error?.message || 'A network error occurred while saving.');
  //     },
  //   });
  // }


 onSaveClicked() {
  this.attributeMasterService.requestSave();
  }

  onResetClicked() {
    this.attributeMasterService.resetForm();
  }
}
