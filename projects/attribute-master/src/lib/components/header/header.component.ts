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

  onSaveClicked() {
    try {
      this.attributeMasterService.saveMaster().subscribe({
        next: (res: any) => {
          if (res.status === 'ok') {
            alert('Attributes saved successfully');
            this.attributeMasterService.clearTable();
            this.attributeMasterService.resetForm();
          } else {
            alert(res.message || 'Save failed');
          }
        },
        error: () => alert('Error while saving data'),
      });
    } catch (err: any) {
      alert(err.message);
    }
  }

  onResetClicked() {
    if (confirm('Are you sure you want to reset the form?')) {
      this.attributeMasterService.resetForm();
    }
  }
}
