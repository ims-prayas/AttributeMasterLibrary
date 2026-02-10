import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {  AttributeMasterService, AttributeDetails} from '../../attribute-master.service';

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
    .pipe(takeUntil(this.destroy$));

  this.attributeMasterService.editData$
  .pipe(takeUntil(this.destroy$))
  .subscribe((data) => {
    this.isEdit = true;
    this.ID = data.ID!;
    const masterData = this.attributeMasterService.attributeMasterObj;

    this.attributeForm.get('AttributeType')?.patchValue(masterData.AttributeType);

    this.attributeMasterService.getApplyToList(masterData.AttributeType).subscribe({
      next: (res: any)=>{
        if (res.status === 'ok') {
        this.applyTo = res.result;
        
        this.attributeForm.patchValue({
          ...data,
          ApplyTo: masterData.ApplyTo,
          IsMappingRequired: masterData.IsMappingRequired,
          MappedBy: masterData.MappedBy,
        }, { emitEvent: false });
      }
      },
      error: ()=> this.attributeMasterService.openErrorDialog('Failed to load apply to data')
    })
  });

    this.attributeMasterService.saveRequested$.pipe(takeUntil(this.destroy$)).subscribe(()=>{
        this.handleSave();
    })

    this.attributeMasterService.resetForm$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.attributeForm.reset();
        this.isEdit = false;
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
      if(v){
        f?.enable();
      }else{
        f?.disable();
      }
    });
    
    this.attributeForm.get('CheckUniqueConstraint')?.valueChanges.subscribe((v) => {
        const f = this.attributeForm.get('ConstraintMode');
       if(v){
        f?.enable();
      }else{
        f?.disable();
      }
    });

    this.attributeForm.get('AttributeType')?.valueChanges.subscribe((type) => {
      if(!type) {
        return;
      }
      if(!this.isEdit){
        this.attributeMasterService.clearTable();
      }

      this.attributeMasterService.getApplyToList(type).subscribe({
        next: (res: any) =>{
          if (res.status === 'ok') {
            this.applyTo = res.result;
          }  
        },
        error: ()=> this.attributeMasterService.openErrorDialog('Failed to load apply to list')
      })

      if (type === 'Document') {
        this.attributeForm.get('IsMappingRequired')?.disable();
      } else {
        this.attributeForm.get('IsMappingRequired')?.enable();
      }
      if(type == 'Transaction'){  
        this.attributeForm.get('ApplyTo')?.disable();
        this.attributeMasterService.loadMaster(type);
      }else{
        this.attributeForm.get('ApplyTo')?.enable();
      }
    });

    this.attributeForm.get('ApplyTo')?.valueChanges.subscribe((id) => {
      const attrType = this.attributeForm.get('AttributeType')?.value;
      if (attrType && id) {
        this.attributeMasterService.loadMaster(attrType, id);
        this.attributeMasterService.getParentAttributes(attrType, id).subscribe({
        next: (res: any)=> {
        if (res.status === 'ok') {
          this.parentAttributes = res.result;
        }
      },
      error: () => this.attributeMasterService.openErrorDialog('Failed to load parent attributes')
    });

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
    this.attributeMasterService.getAttributeTypes().subscribe( {
      next: (res: any)=>{
        if (res.status === 'ok') {
          this.attributeTypes = res.result;
        }
      },
      error: () => this.attributeMasterService.openErrorDialog('Failed to load attribute types')
    });

    this.attributeMasterService.getMappedBy().subscribe({
      next: (res: any)=> {
      if (res.status === 'ok') {
        this.attributesMappedBy = res.result;
        }
      },
      error: () => this.attributeMasterService.openErrorDialog('Failed to load mapped by')
    });
  }

handleAddEditRow() {
  if (!this.attributeForm.valid) {
    this.attributeMasterService.openErrorDialog('Please fill all required fields');
    return;
  }

  const formValue = this.attributeForm.getRawValue();
  const currentDetails = this.attributeMasterService.attributeMasterObj.AttributeDetails;

  try {
    const otherRows = this.isEdit ? currentDetails.filter(r => r.ID !== this.ID) : currentDetails;

    if (otherRows.some(r => r.AttributeName.toLowerCase() === formValue.AttributeName.toLowerCase())) {
      this.attributeMasterService.openErrorDialog('Attribute Name already exists.');
      return;
    }

    if (otherRows.some(r => r.OrderNo === formValue.OrderNo)) {
      this.attributeMasterService.openErrorDialog('Serial Order No already exists.');
      return;
    }

    if (formValue.UseAsBarcode) {
      if (otherRows.some(r => r.UseAsBarcode)) {
        this.attributeMasterService.openErrorDialog('Only one element can have barcode');
        return;
      }
    }

    this.attributeMasterService.attributeMasterObj.AttributeType = formValue.AttributeType;
    this.attributeMasterService.attributeMasterObj.ApplyTo = formValue.ApplyTo;
    this.attributeMasterService.attributeMasterObj.IsMappingRequired = formValue.IsMappingRequired;
    this.attributeMasterService.attributeMasterObj.MappedBy = formValue.MappedBy;

    const detail: AttributeDetails = {
      AttributeName: formValue.AttributeName,
      DataType: formValue.DataType,
      OrderNo: formValue.OrderNo,
      Regex: formValue.Regex,
      HasParent: formValue.HasParent,
      ParentAttribute: formValue.ParentAttribute,
      CheckUniqueConstraint: formValue.CheckUniqueConstraint,
      ConstraintMode: formValue.ConstraintMode,
      IsRequired: formValue.IsRequired ? 1 : 0,
      UseAsBarcode: formValue.UseAsBarcode,
    };

    if (this.isEdit) {
      const index = this.attributeMasterService.attributeMasterObj.AttributeDetails.findIndex((r) => r.ID === this.ID);
      if (index !== -1) {
        this.attributeMasterService.attributeMasterObj.AttributeDetails[index] = { ...detail, ID: this.ID };
      }
      this.isEdit = false;
    } else {
      this.attributeMasterService.attributeMasterObj.AttributeDetails.push(detail);
    }
    
    this.attributeMasterService.syncTable();

    this.attributeForm.reset();
    
    } catch (err: any) {
      this.attributeMasterService.openErrorDialog(err.message);
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
          this.attributeMasterService.openErrorDialog(res.message || 'Save failed');
        }
      },
      error: () => this.attributeMasterService.openErrorDialog('Error saving data')
    });
  }
}