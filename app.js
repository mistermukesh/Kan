// Form configuration
const form = {
  name: {
    label: "Name",
    type: "select",
    value: "",
    items: [],
    disabled: false,
    placeholder: "Select your name",
    rules: [(v) => !!v || "Name is required"],
  },
  party_name: {
    label: "Party Name",
    type: "text",
    value: "",
    disabled: false,
    placeholder: "Enter party name",
    rules: [(v) => !!v || "Party name is required"],
  },
  approved_by: {
    label: "Approved By",
    type: "select",
    value: "",
    items: [],
    disabled: false,
    placeholder: "Select approver",
    rules: [(v) => !!v || "Approver is required"],
  },
  deadline_days: {
    label: "Deadline in Days",
    type: "select",
    value: "2",
    items: Array.from({length: 30}, (_, i) => (i + 1).toString()),
    disabled: false,
    placeholder: "Select number of days",
    rules: [(v) => !!v || "Deadline is required"],
  },
  items: {
    label: "Items (At least one required)",
    type: "table",
    value: [],
    headers: [
      { text: "Sr. No", value: "sr_no" },
      { text: "Item Name & Description", value: "description", rules: [v => !!v || "Required"] },
      { text: "Quantity", value: "quantity", rules: [v => !!v || "Required"] },
      { text: "Actions", value: "actions", sortable: false },
    ],
    disabled: false,
    placeholder: "",
    rules: [
      (v) => (v && v.length > 0) || "At least one item is required",
      (v) => !v || v.every(item => item.description && item.quantity) || "All items must have description and quantity"
    ],
  },
  date: {
    label: "Date",
    type: "date",
    value: new Date().toISOString().substr(0, 10),
    disabled: false,
    placeholder: "Select date",
    rules: [(v) => !!v || "Date is required"],
  },
  signature: {
    label: "Signature",
    type: "signature",
    value: "",
    disabled: false,
    placeholder: "Click to sign",
    items: [],
    rules: [(v) => !!v || "Signature is required"],
  },
  attachments: {
    label: "Attachments (Max 2, 1 required)",
    type: "file",
    value: [],
    disabled: false,
    placeholder: "Click to upload files",
    rules: [
      (v) => (v && v.length > 0) || "At least one attachment is required",
      (v) => !v || v.length <= 2 || "Maximum 2 attachments allowed"
    ],
    uploadStatus: "",
  },
};

// File Upload Component
Vue.component('my-file-upload', {
  template: `
    <div>
      <v-file-input
        v-model="files"
        :label="item.label"
        :placeholder="item.placeholder"
        :rules="item.rules"
        multiple
        prepend-icon="mdi-paperclip"
        @change="handleFileUpload"
        :loading="uploading"
        :disabled="uploading"
        :clearable="false"
        :error-messages="errorMessages"
        outlined
      ></v-file-input>
      
      <v-progress-linear
        v-if="uploading"
        :value="uploadProgress"
        height="10"
        color="primary"
        striped
      ></v-progress-linear>
      
      <div v-if="item.uploadStatus" class="mb-3">
        <v-alert dense text type="info">
          {{ item.uploadStatus }}
        </v-alert>
      </div>
      
      <div v-if="item.value.length > 0">
        <div v-for="(file, index) in item.value" :key="index" class="file-preview-item">
          <v-icon class="mr-2" color="primary">mdi-file-{{ getFileIcon(file.type) }}</v-icon>
          <div style="flex-grow:1;">
            <div class="font-weight-medium">{{ file.filename }}</div>
            <div class="caption">{{ formatFileSize(file.size) }}</div>
          </div>
          <v-btn
            icon
            small
            @click="removeFile(index)"
            color="error"
          >
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  `,
  props: {
    item: Object,
  },
  data: () => ({
    files: [],
    uploading: false,
    uploadProgress: 0,
    errorMessages: [],
  }),
  methods: {
    async handleFileUpload(files) {
      if (!files || files.length === 0) return;
      
      if (files.length > 2) {
        this.errorMessages = ["Maximum 2 attachments allowed"];
        this.files = [];
        return;
      }
      
      this.uploading = true;
      this.uploadProgress = 0;
      this.item.uploadStatus = `Uploading ${files.length} file(s)...`;
      this.errorMessages = [];
      
      try {
        for (const file of files) {
          const processedFile = await this.processFile(file);
          if (processedFile) {
            this.item.value.push(processedFile);
          }
          this.uploadProgress += (100 / files.length);
        }
        
        this.item.uploadStatus = `Upload complete! ${files.length} file(s) added.`;
        setTimeout(() => {
          this.item.uploadStatus = "";
        }, 3000);
      } catch (error) {
        this.item.uploadStatus = "Error uploading files";
        this.errorMessages = ["Error uploading files"];
        console.error("Upload error:", error);
      } finally {
        this.uploading = false;
        this.uploadProgress = 0;
        this.files = [];
      }
    },
    
    async processFile(file) {
      const base64 = await this.readFileAsBase64(file);
      const fileType = file.type || this.getFileTypeFromName(file.name);
      
      return {
        filename: file.name,
        type: fileType,
        size: file.size,
        base64: base64,
        url: null,
        uploadDate: new Date().toLocaleString()
      };
    },
    
    readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    },
    
    removeFile(index) {
      this.item.value.splice(index, 1);
      if (this.item.value.length === 0) {
        this.errorMessages = ["At least one attachment is required"];
      }
    },
    
    getFileIcon(fileType) {
      if (!fileType) return 'outline';
      if (fileType.includes('image')) return 'image-outline';
      if (fileType.includes('pdf')) return 'pdf-box';
      if (fileType.includes('word')) return 'word';
      if (fileType.includes('excel')) return 'excel';
      if (fileType.includes('zip')) return 'zip-box';
      return 'outline';
    },
    
    getFileTypeFromName(filename) {
      const extension = filename.split('.').pop().toLowerCase();
      const types = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'pdf': 'application/pdf', 'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'zip': 'application/zip'
      };
      return types[extension] || 'application/octet-stream';
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }
});

// Signature Component
Vue.component('my-signature', {
  template: `
    <div>
      <v-text-field
        v-model="item.value"
        :label="item.label"
        :placeholder="item.placeholder"
        :rules="item.rules"
        readonly
        outlined
        @click="openDialog"
        prepend-icon="mdi-draw"
      ></v-text-field>
      
      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-card-title class="primary white--text">
            {{ item.label }}
            <v-spacer></v-spacer>
            <v-btn icon dark @click="closeDialog">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          
          <v-card-text class="pa-4">
            <div class="signature-pad-container">
              <canvas ref="signaturePad" width="450" height="200"></canvas>
            </div>
          </v-card-text>
          
          <v-card-actions class="pa-4">
            <v-btn color="error" @click="clearSignature">
              <v-icon left>mdi-delete</v-icon>
              Clear
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="saveSignature">
              <v-icon left>mdi-content-save</v-icon>
              Save Signature
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  `,
  props: {
    item: Object,
  },
  data: () => ({
    dialog: false,
    signaturePad: null,
  }),
  methods: {
    openDialog() {
      this.dialog = true;
      this.$nextTick(() => {
        this.signaturePad = new SignaturePad(this.$refs.signaturePad, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)'
        });
        if (this.item.value) {
          this.signaturePad.fromDataURL(this.item.value);
        }
      });
    },
    closeDialog() {
      this.dialog = false;
    },
    clearSignature() {
      this.signaturePad.clear();
    },
    saveSignature() {
      if (this.signaturePad.isEmpty()) {
        this.item.value = '';
      } else {
        this.item.value = this.signaturePad.toDataURL();
      }
      this.dialog = false;
    }
  }
});

// Table Component
Vue.component('my-table', {
  template: `
    <div>
      <v-data-table
        :headers="item.headers"
        :items="item.value"
        hide-default-footer
        class="elevation-1 mb-4"
      >
        <template v-slot:top>
          <v-toolbar flat color="white">
            <v-toolbar-title>{{ item.label }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="addItem">
              <v-icon left>mdi-plus</v-icon>
              Add Item
            </v-btn>
          </v-toolbar>
        </template>
        
        <template v-slot:item.sr_no="{ item }">
          <v-text-field 
            v-model="item.sr_no" 
            type="number" 
            dense
            outlined
            hide-details
          ></v-text-field>
        </template>
        
        <template v-slot:item.description="{ item }">
          <v-text-field 
            v-model="item.description" 
            dense
            outlined
            hide-details
            :rules="headers.find(h => h.value === 'description').rules"
          ></v-text-field>
        </template>
        
        <template v-slot:item.quantity="{ item }">
          <v-text-field 
            v-model="item.quantity" 
            type="number" 
            dense
            outlined
            hide-details
            :rules="headers.find(h => h.value === 'quantity').rules"
          ></v-text-field>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn icon small @click="deleteItem(item)">
            <v-icon small color="error">mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
      
      <v-alert
        v-if="item.rules && item.rules.some(rule => rule(item.value) !== true)"
        type="error"
        dense
        outlined
      >
        {{ item.rules.find(rule => rule(item.value) !== true)(item.value) }}
      </v-alert>
    </div>
  `,
  props: {
    item: Object,
  },
  computed: {
    headers() {
      return this.item.headers;
    }
  },
  methods: {
    addItem() {
      this.item.value.push({
        sr_no: this.item.value.length + 1,
        description: "",
        quantity: 1
      });
    },
    deleteItem(item) {
      const index = this.item.value.indexOf(item);
      this.item.value.splice(index, 1);
      this.item.value.forEach((item, index) => {
        item.sr_no = index + 1;
      });
    },
  }
});

// Input Component
Vue.component('my-input', {
  template: `
    <component 
      :is="getComponentType()" 
      :item="item"
    ></component>
  `,
  props: {
    item: Object,
  },
  methods: {
    getComponentType() {
      if (this.item.type === 'signature') return 'my-signature';
      if (this.item.type === 'table') return 'my-table';
      if (this.item.type === 'file') return 'my-file-upload';
      return 'v-text-field';
    }
  }
});

// Main Vue App
new Vue({
  el: "#app",
  vuetify: new Vuetify({
    theme: {
      themes: {
        light: {
          primary: '#3f51b5',
          secondary: '#ff9800',
          accent: '#4caf50',
          error: '#f44336',
          warning: '#ffc107',
          info: '#2196f3',
        }
      }
    }
  }),
  data: () => ({
    loading: false,
    title: "KAN Requisition Form",
    subtitle: "Please fill out all required fields",
    form: JSON.parse(JSON.stringify(form)),
    snackbar: {
      show: false,
      message: "",
      color: "",
    },
  }),
  methods: {
    showSnackbar({message, color}) {
      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.show = true;
    },
    async submit() {
      if (!this.$refs.form.validate()) {
        this.showSnackbar({
          message: "Please fill all required fields correctly",
          color: "error"
        });
        return;
      }
      
      this.loading = true;
      
      try {
        // Prepare data for submission
        const formData = {
          name: this.form.name.value,
          party_name: this.form.party_name.value,
          approved_by: this.form.approved_by.value,
          deadline_days: this.form.deadline_days.value,
          items: this.form.items.value,
          date: this.form.date.value,
          signature: this.form.signature.value,
          attachments: this.form.attachments.value,
        };
        
        // For GitHub Pages, we'll use localStorage to simulate data storage
        const submissions = JSON.parse(localStorage.getItem('requisitions') || '[]');
        const id = 'req-' + Date.now();
        
        submissions.push({
          id,
          ...formData,
          timestamp: new Date().toISOString(),
          status: 'Submitted'
        });
        
        localStorage.setItem('requisitions', JSON.stringify(submissions));
        
        this.showSnackbar({
          message: `Form submitted successfully! Reference ID: ${id}`,
          color: "success"
        });
        
        // Reset form
        this.$refs.form.reset();
        this.form.items.value = [];
        this.form.attachments.value = [];
        
      } catch (error) {
        console.error("Submission error:", error);
        this.showSnackbar({
          message: "Error submitting form. Please try again.",
          color: "error"
        });
      } finally {
        this.loading = false;
      }
    },
    loadReferenceData() {
      // Simulate loading reference data
      setTimeout(() => {
        this.form.name.items = [
          "John Doe", "Jane Smith", "Robert Johnson", 
          "Emily Davis", "Michael Wilson"
        ];
        this.form.approved_by.items = [
          "Director", "Manager", "Supervisor",
          "Department Head", "CEO"
        ];
      }, 500);
    }
  },
  mounted() {
    this.loadReferenceData();
  }
});
