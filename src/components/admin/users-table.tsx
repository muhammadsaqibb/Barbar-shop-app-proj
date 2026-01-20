
"use client";

import { useState } from 'react';
import type { AppUser } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import UserRoleUpdater from './user-role-updater';
import { Button } from '../ui/button';
import { Settings } from 'lucide-react';
import { StaffPermissionsDialog } from './staff-permissions-dialog';


export default function UsersTable() {
  const { firestore } = useFirebase();

  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const handleManagePermissions = (user: AppUser) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('name', 'asc')) : null),
    [firestore]
  );

  const { data: users, isLoading: loading, error } = useCollection<AppUser>(usersCollectionRef);

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  if (error) {
    return <p className="text-destructive text-center">{error.message}</p>;
  }

  if (!users || users.length === 0) {
    return <p className="text-muted-foreground text-center">There are no registered users.</p>;
  }

  return (
    <>
    <div className="rounded-md border border-border/20">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="w-[180px]">
                      <UserRoleUpdater user={user} />
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role === 'staff' && (
                        <Button variant="outline" size="sm" onClick={() => handleManagePermissions(user)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Permissions
                        </Button>
                      )}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
    <StaffPermissionsDialog 
        isOpen={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        user={selectedUser}
    />
    </>
  );
}
