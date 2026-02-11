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
  sameAttributeApplied: boolean = false;

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
    if(data.HasParent){
      this.attributeForm.get('ParentAttribute')?.enable()
      this.attributeMasterService.getParentAttributes(masterData.AttributeType, masterData?.ApplyTo as string).subscribe({
        next: (res: any)=> {
        if (res.status === 'ok') {
          this.parentAttributes = res.result;
        }
      },
      error: () => this.attributeMasterService.openErrorDialog('Failed to load parent attributes')})
    }

    if(data.CheckUniqueConstraint){
      this.attributeForm.get('ConstraintMode')?.enable();
    }
    
    this.attributeForm.get('AttributeType')?.patchValue(masterData.AttributeType);

    this.attributeMasterService.getApplyToList(masterData.AttributeType).subscribe({
      next: (res: any)=>{
        if (res.status === 'ok') {
        this.applyTo = res.result;
        
        this.attributeForm.patchValue({
          ...data,
          IsMappingRequired: masterData.IsMappingRequired,
          MappedBy: masterData.MappedBy,
        }, { emitEvent: false });
      }
      this.attributeMasterService.attributeMasterObj.ApplyTo = 'Item';
      },

      error: ()=> this.attributeMasterService.openErrorDialog('Failed to load apply to data')
    })
    console.log('Edit data: ', this.attributeMasterService.attributeMasterObj, this.applyTo )
  });

    this.attributeMasterService.saveRequested$.pipe(takeUntil(this.destroy$)).subscribe(()=>{
        this.handleSave();
    })

    this.attributeMasterService.resetForm$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.attributeForm.reset();
        this.isEdit = false;
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
      OrderNo: ['', [Validators.required, Validators.min(1), Validators.max(1000), Validators.pattern(/^\d+$/) ]],
      Regex: [''],
      HasParent: [false],
      CheckUniqueConstraint: [false],
      ParentAttribute: [{ value: 0, disabled: true }, Validators.required],
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

    this.resetForm();
    
    } catch (err: any) {
      this.attributeMasterService.openErrorDialog(err.message);
    }
  }

  handleSave(){    
    if (this.attributeForm.invalid && this.attributeMasterService.attributeMasterObj.AttributeDetails.length === 0) {
      this.attributeMasterService.openErrorDialog('Please fill required fields');
      return;
    }

    if(this.attributeForm.get('IsMappingRequired')?.value){
      if(!this.attributeForm.get('MappedBy')?.value){
        this.attributeMasterService.openErrorDialog('Attribute Mapped by is required')
        return;
      }
    }
    const formValue = this.attributeForm.getRawValue()
    this.attributeMasterService.attributeMasterObj.AttributeType = formValue.AttributeType;
    this.attributeMasterService.attributeMasterObj.ApplyTo = formValue.ApplyTo;
    this.attributeMasterService.attributeMasterObj.IsMappingRequired = formValue.IsMappingRequired;
    this.attributeMasterService.attributeMasterObj.MappedBy = formValue.MappedBy;

    this.attributeMasterService.saveMaster().subscribe({
      next: (res: any) => {
        if (res.status === 'ok') {
          this.attributeMasterService.resetForm();
          this.attributeMasterService.attributeMasterObj.AttributeType = ''
          this.attributeMasterService.attributeMasterObj.ApplyTo = ''

          this.attributeMasterService.clearTable()
          this.attributeMasterService.openSuccessDialog(res.result);
        } else {
          this.attributeMasterService.openErrorDialog(res.message || 'Save failed');
        }
      },
      error: () => this.attributeMasterService.openErrorDialog('Error saving data')
    });
  }

  changeAttributeTypes($event: Event){
    this.resetOnAttributeTypeChange();

    const type = ($event.target as HTMLInputElement).value
    if(!type){
      return;
    }
    const applyTo = this.attributeForm.get('ApplyTo');
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
        this.attributeForm.get('MappedBy')?.disable();
        this.attributeForm.get('MappedBy')?.reset();

      } else {
        this.attributeForm.get('IsMappingRequired')?.enable();
        this.attributeForm.get('MappedBy')?.enable();
      }
      if(type == 'Transaction'){  
        this.attributeForm.get('ApplyTo')?.disable();
        this.attributeMasterService.loadMaster(type).subscribe({
          next: (res) => {
          if (res.status === 'ok') {
            this.attributeMasterService.attributeMasterObj = {
              AttributeType: type,
              IsMappingRequired: res.result.IsMappingRequired,
              MappedBy: res.result.MappedBy,
              AttributeDetails: res.result.AttributeDetails || [],
            };
            this.enableMappedBy(this.attributeMasterService.attributeMasterObj.IsMappingRequired)
              this.attributeMasterService.syncTable();
            }else{
              this.attributeMasterService.openErrorDialog('Failed to load table data');
            }
          },
          error: ()=> this.attributeMasterService.openErrorDialog('Failed to load attribute details')
        });
      }else{
        this.attributeForm.get('ApplyTo')?.enable();
      }
  }

  handleApplyToChange(event: Event){
    const applyTo = (event.target as HTMLInputElement).value
    const attrType = this.attributeForm.get('AttributeType')?.value;
    if(attrType && applyTo){
      if(this.attributeMasterService.attributeMasterObj.AttributeType == attrType &&  this.attributeMasterService.attributeMasterObj.ApplyTo == applyTo){
        return;
      }
        this.attributeMasterService.loadMaster(attrType, applyTo).subscribe({
          next: (res) => {
          if (res.status === 'ok') {
            this.attributeMasterService.attributeMasterObj = {
              AttributeType: attrType,
              ApplyTo: applyTo,
              IsMappingRequired: res.result.IsMappingRequired,
              MappedBy: res.result.MappedBy,
              AttributeDetails: res.result.AttributeDetails || [],
            };
            this.attributeForm.patchValue({
              IsMappingRequired: res.result.IsMappingRequired,
              MappedBy: res.result.MappedBy
            })
              this.enableMappedBy(this.attributeMasterService.attributeMasterObj.IsMappingRequired)
              this.attributeMasterService.syncTable();
            }else{
              this.attributeMasterService.openErrorDialog('Failed to load table data');
            }
          },
          error: ()=> this.attributeMasterService.openErrorDialog('Failed to load attribute details')
        })
      }
  }

  resetForm(){
    this.isEdit = false;
    this.attributeForm.patchValue({
      AttributeName: '',
      DataType: '',
      OrderNo: '',
      Regex: '',
      HasParent: false,
      ParentAttribute: '',
      CheckUniqueConstraint: false,
      ConstraintMode: '',
      IsRequired: 0,
      UseAsBarcode: false,
    })
  }

  handleParentAttributeChange(event:Event){

//     console.log("event",event);

//     const attrName = this.attributeForm.get('AttributeName')?.value;
//     const parentAttribute = this.attributeForm.get('ParentAttribute')?.value;

// console.log('vlue',attrName,parentAttribute);


//     const filtered = this.parentAttributes.filter(item => item.ID === (event.target as HTMLInputElement).value)
//     console.log('Filtered list: ', filtered)
      // if(filtered.){
      //   this.attributeMasterService.openErrorDialog('Attribute Name and Parent attribute name cannot be same');
      //   this.attributeForm.get('AttributeName')?.setValue('');
      //   return;
      // }
  }

  handleAttributeNameChange(event: Event){
    // const attrName = (event.target as HTMLInputElement).value
    // const parentAttribute = this.attributeForm.get('ParentAttribute')?.value
    // if(attrName == parentAttribute){
    //   this.attributeMasterService.openErrorDialog('Attribute Name and Parent attribute name cannot be same');
    //   this.attributeForm.get('AttributeName')?.setValue('')
    //   return;
    // }
  }

  handleIsMappingRequiredChange($event: Event){
    const checked = this.attributeForm.get('IsMappingRequired')?.value
    if(checked){
      this.attributeForm.get('MappedBy')?.enable();
      this.attributeMasterService.getMappedBy().subscribe({
        next: (res: any)=> {
        if (res.status === 'ok') {
          this.attributesMappedBy = res.result;
          }
        },
        error: () => this.attributeMasterService.openErrorDialog('Failed to load mapped by')
      });
    }else{
      this.attributeForm.get('MappedBy')?.disable();
      this.attributeForm.get('MappedBy')?.reset()
    }
  }

  handleHasParentChange(event: Event){
    const checked = this.attributeForm.get('HasParent')?.value
    const attrType = this.attributeForm.get('AttributeType')?.value
    const applyTo = this.attributeForm.get('ApplyTo')?.value
    
    if(!attrType){
      this.attributeForm.get('HasParent')?.setValue(false);
      this.attributeMasterService.openSuccessDialog('Attribute type is required')
      return;
    }
    if(attrType !== 'Transaction' && !applyTo){
      this.attributeForm.get('HasParent')?.setValue(false);
      this.attributeMasterService.openSuccessDialog('Apply to is required')
      return;
    }

    if(checked){
      this.attributeForm.get('ParentAttribute')?.enable();
      this.attributeMasterService.getParentAttributes(attrType, applyTo).subscribe({
        next: (res: any)=> {
        if (res.status === 'ok') {
          this.parentAttributes = res.result;
        }
      },
      error: () => this.attributeMasterService.openErrorDialog('Failed to load parent attributes')})
    }else{
      this.attributeForm.get('ParentAttribute')?.disable();
      this.attributeForm.get('ParentAttribute')?.reset({value: null});
    }
  }

  handleCheckUniqueConstraintMode(event: Event){
    const checked = this.attributeForm.get('CheckUniqueConstraint')?.value
    if(checked){
      this.attributeForm.get('ConstraintMode')?.enable()
    }else{
      this.attributeForm.get('ConstraintMode')?.disable();
      this.attributeForm.get('ConstraintMode')?.reset({value: null});
    }
  }

  enableMappedBy(isMappingRequired: boolean){
    if(isMappingRequired){
      this.attributeForm.get('MappedBy')?.enable();
       this.attributeMasterService.getMappedBy().subscribe({
          next: (res: any)=> {
            if (res.status === 'ok') {
              this.attributesMappedBy = res.result;
            }
          },
          error: () => this.attributeMasterService.openErrorDialog('Failed to load parent attributes')})
    }
  }

  resetOnAttributeTypeChange(){
    this.attributeForm.get('ApplyTo')?.setValue(null);
    this.attributeForm.get('IsMappingRequired')?.setValue(false);
    this.attributeForm.get('MappedBy')?.setValue('');
    this.resetForm();   
  }

  handleSerialNoChange(event: Event){
    let value = this.attributeForm.get('OrderNo')?.value
    if(value == null){
      return;
    }
    if(!Number.isInteger(value)){
      this.attributeMasterService.openSuccessDialog('Serial Order no cannot have decimal places');
      return;
    }
    if(value < 1){
      this.attributeMasterService.openSuccessDialog('Serial Order no must be greater than 1');
      return;
    }
    else if(value > 1000){
      this.attributeMasterService.openSuccessDialog('Serial Order no cannot exceed 1000');
      return
    }else{
      this.attributeForm.get('OrderNo')?.setValue(value);
    } 
  }
}