import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {  AttributeMasterService} from '../../attribute-master.service';

@Component({
  selector: 'lib-attribute-form',
  templateUrl: './attribute-form.component.html',
  styleUrls: ['./attribute-form.component.css'],
})
export class AttributeFormComponent implements OnInit, OnDestroy {
  attributeForm!: FormGroup;
  isEdit: boolean = false;
  ID!: number;

  private destroy$ = new Subject<void>();
  attributeTypes: any[] = [];
  applyTo: any[] = [];
  parentAttributes: any[] = [];
  attributesMappedBy: any[] = [];

  constructor(
    private fb: FormBuilder,
    public attributeMasterService: AttributeMasterService,
) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();

  this.attributeMasterService.tableData$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      // this.updateBarcodeAvailability();
    });

    // this.attributeMasterService.editData$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe((data) => {
    //     this.isEdit = true;
    //     this.ID = data.ID!;
    //     const masterData = this.attributeMasterService.attributeMasterObj;
    //     this.attributeForm.patchValue({
    //       ...data,
    //       AttributeType: masterData.AttributeType,
    //       ApplyTo: masterData.ApplyTo,
    //       IsMappingRequired: masterData.IsMappingRequired,
    //       MappedBy: masterData.MappedBy,
    //     });
    //     this.updateBarcodeAvailability();
    //   });

    this.attributeMasterService.editData$
  .pipe(takeUntil(this.destroy$))
  .subscribe((data) => {
    this.isEdit = true;
    this.ID = data.ID!;
    const masterData = this.attributeMasterService.attributeMasterObj;

    this.attributeForm.get('AttributeType')?.patchValue(masterData.AttributeType);

    this.attributeMasterService.getApplyToList(masterData.AttributeType).subscribe((res: any) => {
      if (res.status === 'ok') {
        this.applyTo = res.result;
        
        this.attributeForm.patchValue({
          ...data,
          ApplyTo: masterData.ApplyTo,
          IsMappingRequired: masterData.IsMappingRequired,
          MappedBy: masterData.MappedBy,
        }, { emitEvent: false });
        
        // this.updateBarcodeAvailability();
      }
    });
  });

      this.attributeMasterService.saveRequested$.pipe(takeUntil(this.destroy$))
      .subscribe(()=>{
        this.handleSave();
      })

    this.attributeMasterService.resetForm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.attributeForm.reset();
        this.isEdit = false;
        // this.updateBarcodeAvailability();
      });

    this.attributeForm.get('IsMappingRequired')?.valueChanges.subscribe((v) => {
      const f = this.attributeForm.get('MappedBy');
      if (v) {
        f?.enable();
      } else {
        f?.reset({ value: null, disabled: true });
      }
    });
    this.attributeForm.get('HasParent')?.valueChanges.subscribe((v) => {
      const f = this.attributeForm.get('ParentAttribute');
      v ? f?.enable() : f?.disable();
    });
    this.attributeForm
      .get('CheckUniqueConstraint')
      ?.valueChanges.subscribe((v) => {
        const f = this.attributeForm.get('ConstraintMode');
        v ? f?.enable() : f?.disable();
      });

    this.attributeForm.get('AttributeType')?.valueChanges.subscribe((type) => {
      if(!type) {
        return;
      }
      this.attributeMasterService.getApplyToList(type).subscribe((res: any) => {
        if (res.status === 'ok') {
          this.applyTo = res.result;
        }
      });

      if (type === 'Document') {
        this.attributeForm.get('IsMappingRequired')?.disable();
      } else {
        this.attributeForm.get('IsMappingRequired')?.enable();
      }
      if(type == 'Transaction'){  
         this.attributeForm.get('ApplyTo')?.setValue(null);
          this.attributeMasterService.loadMaster(type);
      }
    });

    this.attributeForm.get('ApplyTo')?.valueChanges.subscribe((id) => {
      const attrType = this.attributeForm.get('AttributeType')?.value;
      if (attrType && id) {
        if (this.attributeMasterService.attributeMasterObj.AttributeType === attrType && this.attributeMasterService.attributeMasterObj.ApplyTo === id) {
          return;
        }
        this.attributeMasterService.loadMaster(attrType, id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.attributeForm = this.fb.group({
      AttributeType: ['', Validators.required],
      ApplyTo: [''],
      IsMappingRequired: [false],
      MappedBy: [{ value: '', disabled: true }, Validators.required],
      AttributeName: ['', Validators.required],
      DataType: ['', Validators.required],
      OrderNo: ['', Validators.required],
      Regex: [''],
      HasParent: [false],
      CheckUniqueConstraint: [false],
      ParentAttribute: [{ value: '', disabled: true }, Validators.required],
      ConstraintMode: [{ value: '', disabled: true }, Validators.required],
      IsRequired: [0],
      UseAsBarcode: [false],
    });
  }

  loadDropdowns() {
    this.attributeMasterService.getAttributeTypes().subscribe((res: any) => {
      if (res.status === 'ok') this.attributeTypes = res.result;
    });
    this.attributeMasterService.getParentAttributes().subscribe((res: any) => {
      if (res.status === 'ok') this.parentAttributes = res.result;
    });
    this.attributeMasterService.getMappedBy().subscribe((res: any) => {
      if (res.status === 'ok') this.attributesMappedBy = res.result;
    });
  }

  handleAddEditRow() {
    if (!this.attributeForm.valid) {
      this.attributeMasterService.openErrorDialog('Please fill all required fields');
      return;
    }

    const formValue = this.attributeForm.getRawValue();

    const row = {
      ...formValue,
      AttributeType: formValue.AttributeType,
      ApplyTo: formValue.ApplyTo,
      IsMappingRequired: formValue.IsMappingRequired,
      MappedBy: formValue.MappedBy,
      IsRequired: formValue.IsRequired ? 1 : 0,
    };

    try {
      if (this.isEdit) {
        this.attributeMasterService.addOrUpdateRow(row, true, this.ID);
        this.isEdit = false;
      } else {
        this.attributeMasterService.addOrUpdateRow(row);
      }

      this.attributeForm.reset();
    } catch (err: any) {
      alert(err.message);
    }
  }


  updateBarcodeAvailability(): void {
    const control = this.attributeForm.get('UseAsBarcode');
    if (!control) {
      return;
    }
    const barcodeExists = this.attributeMasterService.hasBarcodeAttribute(this.isEdit ? this.ID : undefined);

    if (barcodeExists) {
      control.setValue(false, { emitEvent: false });
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  }

  handleSave(){    
    if (this.attributeForm.invalid && this.attributeMasterService.attributeMasterObj.AttributeDetails.length === 0) {
      this.attributeMasterService.openErrorDialog('Please fill required fields');
      return;
    }

    this.attributeMasterService.saveMaster().subscribe({
      next: (res: any) => {
        if (res.status === 'ok') {
          this.attributeMasterService.resetForm();
          this.attributeMasterService.clearTable()
          this.attributeMasterService.openSuccessDialog(res.result);
        } else {
          alert(res.message || 'Save failed');
        }
      },
      error: () => alert('Network error while saving Master')
    });
  }
}