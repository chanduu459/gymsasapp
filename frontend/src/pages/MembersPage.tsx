import { useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';
import type { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Loader2, Phone, Mail, UserCheck, UserX, Camera, Upload, X, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function MembersPage() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFaceImage, setSelectedFaceImage] = useState<File | null>(null);
  const [facePreviewUrl, setFacePreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    return () => {
      if (facePreviewUrl) {
        URL.revokeObjectURL(facePreviewUrl);
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facePreviewUrl]);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !cameraStreamRef.current) {
      return;
    }

    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => {
      toast.error('Unable to start camera preview');
    });
  }, [isCameraOpen]);

  const loadMembers = async () => {
    try {
      const response = await api.getMembers();
      if (response.success && response.data) {
        setMembers(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.createMember(
        formData.fullName,
        formData.email,
        formData.phone,
        formData.password || undefined,
        selectedFaceImage || undefined
      );

      if (response.success && response.data) {
        toast.success('Member created successfully');
        setMembers([response.data, ...members]);
        setIsDialogOpen(false);
        if (facePreviewUrl) {
          URL.revokeObjectURL(facePreviewUrl);
        }
        setSelectedFaceImage(null);
        setFacePreviewUrl(null);
        setFormData({ fullName: '', email: '', phone: '', password: '' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmitting(true);

    try {
      const response = await api.updateMember(
        editingMember.id,
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          is_active: editingMember.is_active,
        },
        selectedFaceImage || undefined
      );

      if (response.success && response.data) {
        toast.success('Member updated successfully');
        setMembers(members.map((m) => (m.id === editingMember.id ? response.data! : m)));
        setIsEditDialogOpen(false);
        if (facePreviewUrl) {
          URL.revokeObjectURL(facePreviewUrl);
        }
        setSelectedFaceImage(null);
        setFacePreviewUrl(null);
        setFormData({ fullName: '', email: '', phone: '', password: '' });
        setEditingMember(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (facePreviewUrl) {
      URL.revokeObjectURL(facePreviewUrl);
    }

    setSelectedFaceImage(file);
    setFacePreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    if (facePreviewUrl) {
      URL.revokeObjectURL(facePreviewUrl);
    }
    setSelectedFaceImage(null);
    setFacePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Camera is not supported in this browser');
        return;
      }

      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      toast.error('Unable to access camera. Check browser permissions.');
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error('Failed to capture image from camera');
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92);
    });

    if (!blob) {
      toast.error('Failed to capture image from camera');
      return;
    }

    const capturedFile = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    handleImageSelect(capturedFile);
    stopCamera();
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      stopCamera();
      clearSelectedImage();
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      stopCamera();
      clearSelectedImage();
      setEditingMember(null);
    }
  };

  const openEditDialog = (member: User) => {
    setEditingMember(member);
    setFormData({
      fullName: member.full_name,
      email: member.email,
      phone: member.phone || '',
      password: '',
    });
    if (member.face_image_url) {
      setFacePreviewUrl(member.face_image_url);
    }
    setSelectedFaceImage(null);
    setIsEditDialogOpen(true);
  };

  const filteredMembers = members.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canAddMember = currentUser?.role === 'owner' || currentUser?.role === 'staff';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 mt-1">Manage your gym members</p>
        </div>
        {canAddMember && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Create a new member account. They'll receive an email with login instructions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Face Image (optional)</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4" />
                        Upload File
                      </Button>
                      <Button type="button" variant="outline" className="gap-2" onClick={startCamera}>
                        <Camera className="w-4 h-4" />
                        Use Camera
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                    />
                    {isCameraOpen && (
                      <div className="space-y-2 rounded-md border p-2">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-md bg-black" />
                        <div className="flex gap-2">
                          <Button type="button" className="gap-2" onClick={captureFromCamera}>
                            <Camera className="w-4 h-4" />
                            Capture
                          </Button>
                          <Button type="button" variant="outline" onClick={stopCamera}>
                            Close Camera
                          </Button>
                        </div>
                      </div>
                    )}
                    {facePreviewUrl && (
                      <div className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-3">
                          <img src={facePreviewUrl} alt="Face preview" className="w-12 h-12 rounded object-cover" />
                          <p className="text-sm text-gray-600">{selectedFaceImage?.name || 'Selected image'}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={clearSelectedImage}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank for default"
                    />
                    <p className="text-xs text-gray-500">If left blank, default password will be "welcome123"</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Member'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search members by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Members ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserX className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No members found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.full_name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.is_active ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {canAddMember && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editFullName">Full Name</Label>
                <Input
                  id="editFullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Face Image (optional)</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                    Upload File
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={startCamera}>
                    <Camera className="w-4 h-4" />
                    Use Camera
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                />
                {isCameraOpen && (
                  <div className="space-y-2 rounded-md border p-2">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-md bg-black" />
                    <div className="flex gap-2">
                      <Button type="button" className="gap-2" onClick={captureFromCamera}>
                        <Camera className="w-4 h-4" />
                        Capture
                      </Button>
                      <Button type="button" variant="outline" onClick={stopCamera}>
                        Close Camera
                      </Button>
                    </div>
                  </div>
                )}
                {facePreviewUrl && (
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <div className="flex items-center gap-3">
                      <img src={facePreviewUrl} alt="Face preview" className="w-12 h-12 rounded object-cover" />
                      <p className="text-sm text-gray-600">{selectedFaceImage?.name || 'Current image'}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={clearSelectedImage}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleEditDialogChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.fullName || !formData.email}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Member'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
