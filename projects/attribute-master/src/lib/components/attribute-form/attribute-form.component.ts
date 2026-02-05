import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AttributeMasterService,
  AttributeDetails,
} from '../../attribute-master.service';

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

    this.attributeMasterService.editData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.isEdit = true;
        this.ID = data.ID!;
        this.attributeForm.patchValue(data);
      });

    this.attributeMasterService.resetForm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
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
      const f = this.attributeForm.get('ParentField');
      v ? f?.enable() : f?.disable();
    });
    this.attributeForm
      .get('CheckUniqueConstraint')
      ?.valueChanges.subscribe((v) => {
        const f = this.attributeForm.get('ConstraintMode');
        v ? f?.enable() : f?.disable();
      });

    this.attributeForm.get('AttributeType')?.valueChanges.subscribe((type) => {
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
    });

    this.attributeForm.get('ApplyTo')?.valueChanges.subscribe((id) => {
      const attrType = this.attributeForm.get('AttributeType')?.value;
      if (attrType && id) {
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
      ApplyTo: ['', Validators.required],
      IsMappingRequired: [false],
      MappedBy: [{ value: '', disabled: true }, Validators.required],
      FieldName: ['', Validators.required],
      DataType: ['', Validators.required],
      OrderNo: ['', Validators.required],
      Regex: [''],
      HasParent: [false],
      CheckUniqueConstraint: [false],
      ParentField: [{ value: '', disabled: true }, Validators.required],
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

  onSubmit() {
    if (!this.attributeForm.valid) {
      alert('Please fill all required fields');
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
}
